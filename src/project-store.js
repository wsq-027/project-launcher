const Storage = require('node-storage')
const { getUserPath } = require('./common')

function omit(obj, key) {
  const result = {}

  for (const name in obj) {
    if (name !== key) {
      result[name] = obj[name]
    }
  }

  return result
}

class ProjectStore {
  constructor() {
    this.map = new Map
    this.storage = new Storage(getUserPath() + '/projects-storage.json')

    for (const name in this.storage.store) {
      this.map.set(name, { ...this.storage.store[name], isStart: false })
    }
  }

  add(project) {
    if (this.has(project.name)) {
      throw new Error('项目名不能重复')
    }

    const name = project.name
    this.storage.put(name, omit(project, 'isStart'))
    this.map.set(name, project)
  }

  update(name, project) {
    if (!this.has(name)) {
      throw new Error('找不到该项目')
    }

    this.storage.put(name, omit(project, 'isStart'))
    this.map.set(name, project)
  }

  remove(name) {
    if (!this.has(name)) {
      throw new Error('找不到该项目')
    }

    this.storage.remove(name)
    this.map.delete(name)
  }

  has(name) {
    return this.map.has(name)
  }

  get(name) {
    if (!this.has(name)) {
      throw new Error('找不到该项目')
    }

    return this.map.get(name)
  }

  [Symbol.iterator]() {
    return this.map.values()
  }
}

const store = new ProjectStore()

module.exports = store
