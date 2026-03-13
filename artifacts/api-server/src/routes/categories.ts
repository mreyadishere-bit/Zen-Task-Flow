import { Router, type IRouter } from "express";
import { db, categoriesTable, tasksTable } from "@workspace/db";
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  UpdateCategoryParams,
  DeleteCategoryParams,
} from "@workspace/api-zod";
import { eq, sql, and } from "drizzle-orm";

const router: IRouter = Router();

async function enrichCategory(cat: typeof categoriesTable.$inferSelect) {
  const [counts] = await db
    .select({
      taskCount: sql<number>`COUNT(*)`,
      completedCount: sql<number>`COUNT(*) FILTER (WHERE ${tasksTable.completed} = true)`,
    })
    .from(tasksTable)
    .where(eq(tasksTable.categoryId, cat.id));

  return {
    id: cat.id,
    name: cat.name,
    color: cat.color,
    icon: cat.icon ?? null,
    taskCount: Number(counts?.taskCount ?? 0),
    completedCount: Number(counts?.completedCount ?? 0),
  };
}

router.get("/", async (_req, res) => {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  const enriched = await Promise.all(cats.map(enrichCategory));
  res.json(enriched);
});

router.post("/", async (req, res) => {
  const body = CreateCategoryBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [cat] = await db
    .insert(categoriesTable)
    .values({
      name: body.data.name,
      color: body.data.color,
      icon: body.data.icon ?? null,
    })
    .returning();

  res.status(201).json(await enrichCategory(cat));
});

router.put("/:id", async (req, res) => {
  const params = UpdateCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid category ID" });
    return;
  }

  const body = UpdateCategoryBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Partial<typeof categoriesTable.$inferInsert> = {};
  if (body.data.name !== undefined) updateData.name = body.data.name;
  if (body.data.color !== undefined) updateData.color = body.data.color;
  if (body.data.icon !== undefined) updateData.icon = body.data.icon;

  const [cat] = await db
    .update(categoriesTable)
    .set(updateData)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();

  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.json(await enrichCategory(cat));
});

router.delete("/:id", async (req, res) => {
  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid category ID" });
    return;
  }

  const [deleted] = await db
    .delete(categoriesTable)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.status(204).send();
});

export default router;
