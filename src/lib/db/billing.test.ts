import { describe, it, expect, vi, beforeEach } from "vitest"

const mockFindUniqueOrThrow = vi.fn()
const mockFindFirst = vi.fn()
const mockUpdate = vi.fn()
const mockCustomersCreate = vi.fn()

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUniqueOrThrow: (...args: unknown[]) => mockFindUniqueOrThrow(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}))

vi.mock("@/lib/stripe", () => ({
  stripe: {
    customers: {
      create: (...args: unknown[]) => mockCustomersCreate(...args),
    },
  },
}))

import {
  getOrCreateStripeCustomer,
  syncSubscriptionStatus,
  getUserBillingInfo,
} from "./billing"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getOrCreateStripeCustomer", () => {
  it("returns existing stripeCustomerId when present", async () => {
    mockFindUniqueOrThrow.mockResolvedValueOnce({
      stripeCustomerId: "cus_existing",
      email: "test@test.com",
      name: "Test",
    })

    const result = await getOrCreateStripeCustomer("user1")
    expect(result).toBe("cus_existing")
    expect(mockCustomersCreate).not.toHaveBeenCalled()
  })

  it("creates Stripe customer and stores ID when none exists", async () => {
    mockFindUniqueOrThrow.mockResolvedValueOnce({
      stripeCustomerId: null,
      email: "test@test.com",
      name: "Test",
    })
    mockCustomersCreate.mockResolvedValueOnce({ id: "cus_new" })
    mockUpdate.mockResolvedValueOnce({})

    const result = await getOrCreateStripeCustomer("user1")
    expect(result).toBe("cus_new")
    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: "test@test.com",
      name: "Test",
      metadata: { userId: "user1" },
    })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user1" },
      data: { stripeCustomerId: "cus_new" },
    })
  })
})

describe("syncSubscriptionStatus", () => {
  it("updates isPro and stripeSubscriptionId", async () => {
    mockFindFirst.mockResolvedValueOnce({ id: "user1" })
    mockUpdate.mockResolvedValueOnce({})

    await syncSubscriptionStatus("cus_123", "sub_456", true)
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { stripeCustomerId: "cus_123" },
      select: { id: true },
    })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user1" },
      data: { isPro: true, stripeSubscriptionId: "sub_456" },
    })
  })

  it("nulls stripeSubscriptionId when isPro is false", async () => {
    mockFindFirst.mockResolvedValueOnce({ id: "user1" })
    mockUpdate.mockResolvedValueOnce({})

    await syncSubscriptionStatus("cus_123", "sub_456", false)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user1" },
      data: { isPro: false, stripeSubscriptionId: null },
    })
  })
})

describe("getUserBillingInfo", () => {
  it("returns billing fields for user", async () => {
    mockFindUniqueOrThrow.mockResolvedValueOnce({
      isPro: true,
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_456",
    })

    const result = await getUserBillingInfo("user1")
    expect(result).toEqual({
      isPro: true,
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_456",
    })
  })
})
