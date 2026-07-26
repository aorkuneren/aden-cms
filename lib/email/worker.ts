export async function processEmailJobs(limit = 10) {
  void limit
  return { claimed: 0, sent: 0, retry: 0, failed: 0, skipped: 0 }
}
