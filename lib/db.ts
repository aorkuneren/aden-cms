/**
 * Standalone website mock database stub.
 * This project uses mock JSON data instead of a live Prisma/MySQL connection.
 */
export const prisma: any = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === "$connect" || prop === "$disconnect") {
        return async () => {}
      }
      return new Proxy(
        {},
        {
          get(_targetSub, subProp) {
            return async (..._args: any[]) => {
              if (subProp === "findMany") return []
              if (subProp === "findFirst" || subProp === "findUnique") return null
              if (subProp === "count") return 0
              if (subProp === "create") return { id: "mock-id-" + Math.random().toString(36).slice(2, 8) }
              if (subProp === "update" || subProp === "upsert" || subProp === "delete") return {}
              return null
            }
          },
        }
      )
    },
  }
)
