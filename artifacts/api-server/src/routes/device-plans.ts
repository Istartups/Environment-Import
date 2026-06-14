import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { authenticateAdmin } from "../middlewares/auth";

const router = Router();

// ── Public: list active plans (for PWA) ──────────────────────────────────────
router.get("/device-plans", async (_req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT id, name, description, device_count AS "deviceCount", price, is_active AS "isActive", sort_order AS "sortOrder"
      FROM device_plans
      WHERE is_active = true
      ORDER BY sort_order ASC, id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch device plans" });
  }
});

// ── Admin: list all plans ─────────────────────────────────────────────────────
router.get("/admin/device-plans", authenticateAdmin as any, async (_req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT id, name, description, device_count AS "deviceCount", price, is_active AS "isActive", sort_order AS "sortOrder", created_at AS "createdAt"
      FROM device_plans
      ORDER BY sort_order ASC, id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch device plans" });
  }
});

// ── Admin: create plan ────────────────────────────────────────────────────────
router.post("/admin/device-plans", authenticateAdmin as any, async (req, res) => {
  const { name, description, deviceCount, price, isActive, sortOrder } = req.body;
  if (!name || !deviceCount || price === undefined) {
    return res.status(400).json({ message: "name, deviceCount, and price are required" });
  }
  try {
    const result = await db.execute(sql`
      INSERT INTO device_plans (name, description, device_count, price, is_active, sort_order)
      VALUES (${name}, ${description || null}, ${Number(deviceCount)}, ${Number(price)}, ${isActive ?? true}, ${sortOrder ?? 0})
      RETURNING id, name, description, device_count AS "deviceCount", price, is_active AS "isActive", sort_order AS "sortOrder"
    `);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to create device plan" });
  }
});

// ── Admin: update plan ────────────────────────────────────────────────────────
router.put("/admin/device-plans/:id", authenticateAdmin as any, async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, deviceCount, price, isActive, sortOrder } = req.body;
  try {
    const result = await db.execute(sql`
      UPDATE device_plans
      SET name = ${name}, description = ${description || null},
          device_count = ${Number(deviceCount)}, price = ${Number(price)},
          is_active = ${isActive ?? true}, sort_order = ${sortOrder ?? 0},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, description, device_count AS "deviceCount", price, is_active AS "isActive", sort_order AS "sortOrder"
    `);
    if (!result.rows.length) return res.status(404).json({ message: "Plan not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to update device plan" });
  }
});

// ── Admin: delete plan ────────────────────────────────────────────────────────
router.delete("/admin/device-plans/:id", authenticateAdmin as any, async (req, res) => {
  const id = Number(req.params.id);
  try {
    await db.execute(sql`DELETE FROM device_plans WHERE id = ${id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete device plan" });
  }
});

export default router;
