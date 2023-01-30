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

/**
 * @typedef {Object} ProjectItem
 * @property {String} name
 * @property {String} dir
 * @property {String} urlPrefix
 * @property {String} proxyHost
 * @property {Boolean} isLocal
 * @property {String} script
 * @property {Boolean} isStart
 */
class ProjectStore {
  constructor() {
    /**
     * @type {Map<string, ProjectItem>}
     */
    this.map = new Map
    this.storage = new Storage(getUserPath() + '/projects-storage.json')

    for (const name in this.storage.store) {
      this.map.set(name, { ...this.storage.store[name], isStart: false })
    }
  }

  /**
   * @param {ProjectItem} project
   */
  add(project) {
    if (this.has(project.name)) {
      throw new Error('项目名不能重复')
    }

    const name = project.name
    this.storage.put(name, omit(project, 'isStart'))
    this.map.set(name, project)
  }

  /**
   * @param {String} name
   * @param {ProjectItem} project
   */
  update(name, project) {
    if (!this.has(name)) {
      throw new Error('找不到该项目')
    }

    this.storage.put(name, omit(project, 'isStart'))
    this.map.set(name, project)
  }

  /**
   * @param {String} name
   */
  remove(name) {
    if (!this.has(name)) {
      throw new Error('找不到该项目')
    }

    this.storage.remove(name)
    this.map.delete(name)
  }

  /**
   *
   * @param {String} name
   * @returns {Boolean}
   */
  has(name) {
    return this.map.has(name)
  }

  /**
   *
   * @param {String} name
   * @returns {ProjectItem}
   */
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

module.exports = ProjectStore
