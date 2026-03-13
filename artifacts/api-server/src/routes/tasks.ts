import { Router, type IRouter } from "express";
import { db, tasksTable, categoriesTable } from "@workspace/db";
import {
  CreateTaskBody,
  UpdateTaskBody,
  ReorderTasksBody,
  GetTasksQueryParams,
  GetTaskParams,
  UpdateTaskParams,
  DeleteTaskParams,
} from "@workspace/api-zod";
import { eq, asc, and, isNull, sql } from "drizzle-orm";

const router: IRouter = Router();

function toApiTask(task: typeof tasksTable.$inferSelect) {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    completed: task.completed,
    priority: task.priority,
    categoryId: task.categoryId ?? null,
    dueDate: task.dueDate ?? null,
    sortOrder: task.sortOrder,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
  };
}

router.get("/", async (req, res) => {
  const query = GetTasksQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { focusMode, categoryId } = query.data;

  let conditions = [];

  if (focusMode) {
    const today = new Date().toISOString().split("T")[0];
    conditions.push(
      sql`(${tasksTable.dueDate} = ${today} OR DATE(${tasksTable.createdAt}) = ${today}::date)`
    );
  }

  if (categoryId !== undefined) {
    conditions.push(eq(tasksTable.categoryId, categoryId));
  }

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(tasksTable.sortOrder), asc(tasksTable.createdAt));

  res.json(tasks.map(toApiTask));
});

router.post("/reorder", async (req, res) => {
  const body = ReorderTasksBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { orderedIds } = body.data;

  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(tasksTable)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(eq(tasksTable.id, orderedIds[i]));
    }
  });

  const tasks = await db.select().from(tasksTable).orderBy(asc(tasksTable.sortOrder));
  res.json(tasks.map(toApiTask));
});

router.get("/:id", async (req, res) => {
  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, params.data.id));
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(toApiTask(task));
});

router.post("/", async (req, res) => {
  const body = CreateTaskBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const maxOrderResult = await db
    .select({ maxOrder: sql<number>`COALESCE(MAX(${tasksTable.sortOrder}), -1)` })
    .from(tasksTable);
  const maxOrder = maxOrderResult[0]?.maxOrder ?? -1;

  const [task] = await db
    .insert(tasksTable)
    .values({
      title: body.data.title,
      description: body.data.description ?? null,
      priority: body.data.priority,
      categoryId: body.data.categoryId ?? null,
      dueDate: body.data.dueDate ?? null,
      sortOrder: maxOrder + 1,
    })
    .returning();

  res.status(201).json(toApiTask(task));
});

router.put("/:id", async (req, res) => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  const body = UpdateTaskBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Partial<typeof tasksTable.$inferInsert> & { updatedAt: Date; completedAt?: Date | null } = {
    updatedAt: new Date(),
  };

  if (body.data.title !== undefined) updateData.title = body.data.title;
  if (body.data.description !== undefined) updateData.description = body.data.description;
  if (body.data.priority !== undefined) updateData.priority = body.data.priority;
  if (body.data.categoryId !== undefined) updateData.categoryId = body.data.categoryId;
  if (body.data.dueDate !== undefined) updateData.dueDate = body.data.dueDate;
  if (body.data.sortOrder !== undefined) updateData.sortOrder = body.data.sortOrder;
  if (body.data.completed !== undefined) {
    updateData.completed = body.data.completed;
    updateData.completedAt = body.data.completed ? new Date() : null;
  }

  const [task] = await db
    .update(tasksTable)
    .set(updateData)
    .where(eq(tasksTable.id, params.data.id))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(toApiTask(task));
});

router.delete("/:id", async (req, res) => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  const [deleted] = await db
    .delete(tasksTable)
    .where(eq(tasksTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.status(204).send();
});

export default router;
