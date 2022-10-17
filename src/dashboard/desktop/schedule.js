let scheduleList = []

function createSchedule({ idPrefix = '', delay, callback, onClose = () => {} }) {
  let timeoutFlag = null
  let hasStart = false
  const id = idPrefix + Date.now().toString()

  function stop() {
    clearTimeout(timeoutFlag)
    hasStart = false
    onClose()
  }

  const refresh = async () => {
    if (!hasStart) {
      return
    }

    await callback()
    timeoutFlag = setTimeout(refresh, delay)
  }

  const start = () => {
    if (hasStart) {
      return
    }

    hasStart = true
    refresh()
  }

  const schedule = {
    start,
    stop,
    id,
  }

  scheduleList.push(schedule)

  return schedule
}

function clearSchedule() {
  scheduleList.forEach((schedule) => schedule.stop())
  scheduleList = []
}

module.exports = {
  createSchedule,
  clearSchedule,
}
