class Book {
  constructor(data = {}) {
    this.id = data._id || ''
    this.name = data.name || ''
    this.creatorId = data.creatorId || ''  // 创建者ID
    this.isShared = data.isShared || false // 是否共享
    this.members = data.members || []       // 共享成员列表
    this.isDeleted = data.isDeleted || false // 逻辑删除标记
    this.createTime = data.createTime || new Date()
    this.updateTime = data.updateTime || new Date()
  }
}

export default Book 