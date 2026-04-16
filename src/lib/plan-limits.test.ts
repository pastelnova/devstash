import { describe, it, expect, vi, beforeEach } from "vitest"

const mockCount = vi.fn()

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { count: (...args: unknown[]) => mockCount("item", ...args) },
    collection: { count: (...args: unknown[]) => mockCount("collection", ...args) },
  },
}))

import {
  canCreateItem,
  canCreateCollection,
  getUserLimits,
  FREE_PLAN_ITEM_LIMIT,
  FREE_PLAN_COLLECTION_LIMIT,
} from "./plan-limits"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("canCreateItem", () => {
  it("returns true for Pro user regardless of count", async () => {
    const result = await canCreateItem("user1", true)
    expect(result).toBe(true)
    expect(mockCount).not.toHaveBeenCalled()
  })

  it("returns true for free user below limit", async () => {
    mockCount.mockResolvedValueOnce(10)
    const result = await canCreateItem("user1", false)
    expect(result).toBe(true)
  })

  it("returns false for free user at limit", async () => {
    mockCount.mockResolvedValueOnce(FREE_PLAN_ITEM_LIMIT)
    const result = await canCreateItem("user1", false)
    expect(result).toBe(false)
  })
})

describe("canCreateCollection", () => {
  it("returns true for Pro user regardless of count", async () => {
    const result = await canCreateCollection("user1", true)
    expect(result).toBe(true)
    expect(mockCount).not.toHaveBeenCalled()
  })

  it("returns true for free user below limit", async () => {
    mockCount.mockResolvedValueOnce(1)
    const result = await canCreateCollection("user1", false)
    expect(result).toBe(true)
  })

  it("returns false for free user at limit", async () => {
    mockCount.mockResolvedValueOnce(FREE_PLAN_COLLECTION_LIMIT)
    const result = await canCreateCollection("user1", false)
    expect(result).toBe(false)
  })
})

describe("getUserLimits", () => {
  it("returns null limits for Pro user", async () => {
    mockCount.mockResolvedValueOnce(25)
    const result = await getUserLimits("user1", true)
    expect(result.items.limit).toBeNull()
    expect(result.collections.limit).toBeNull()
  })

  it("returns correct current counts and limits for free user", async () => {
    mockCount.mockResolvedValueOnce(15) // item count
    mockCount.mockResolvedValueOnce(2) // collection count
    const result = await getUserLimits("user1", false)
    expect(result).toEqual({
      items: { current: 15, limit: FREE_PLAN_ITEM_LIMIT },
      collections: { current: 2, limit: FREE_PLAN_COLLECTION_LIMIT },
    })
  })
})
