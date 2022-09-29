class ProjectStore {
  map = new Map

  add(project) {
    if (this.has(project.name)) {
      throw new Error('项目名不能重复')
    }

    const name = project.name
    this.map.set(name, project)
  }

  remove(name) {
    if (!this.has(name)) {
      throw new Error('找不到该项目')
    }

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

  iter() {
    return this.map.values()
  }
}

module.exports = new ProjectStore
