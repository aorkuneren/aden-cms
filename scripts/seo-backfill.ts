import { runSeoBackfill } from "../lib/seo/backfill"

runSeoBackfill()
  .then((report) => {
    console.log(JSON.stringify(report, null, 2))
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
