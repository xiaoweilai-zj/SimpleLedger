import Book from '../../models/book'
import DB from '../../utils/db'
import eventBus from '../../utils/eventBus'

Page({
  data: {
    id: '',
    name: '',
    isShared: false,
    members: [],
    isCreator: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id })
      this.getBookDetail()
    }
  },

  async getBookDetail() {
    const db = new DB('books')
    const book = await db.doc(this.data.id).get()
    if (book) {
      this.setData({
        name: book.name,
        isShared: book.isShared,
        members: book.members,
        isCreator: book.creatorId === getApp().globalData.userInfo.openId
      })
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onShareChange(e) {
    this.setData({ isShared: e.detail.value })
  },

  async addMember() {
    wx.navigateTo({
      url: '/pages/memberSelect/memberSelect'
    })
  },

  removeMember(e) {
    const memberId = e.currentTarget.dataset.id
    const members = this.data.members.filter(m => m.openId !== memberId)
    this.setData({ members })
  },

  async saveBook() {
    if (!this.data.name.trim()) {
      wx.showToast({
        title: '请输入账本名称',
        icon: 'none'
      })
      return
    }

    const db = new DB('books')
    const book = new Book({
      name: this.data.name,
      isShared: this.data.isShared,
      members: this.data.members
    })

    try {
      if (this.data.id) {
        await db.doc(this.data.id).update({
          name: book.name,
          isShared: book.isShared,
          members: book.members,
          updateTime: new Date()
        })
      } else {
        book.creatorId = getApp().globalData.userInfo.openId
        await db.add(book)
      }

      eventBus.emit('bookUpdated')
      wx.navigateBack()
    } catch (err) {
      console.error('保存账本失败:', err)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  async deleteBook() {
    if (!this.data.isCreator) {
      wx.showToast({
        title: '只有创建者可以删除账本',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认删除',
      content: '删除后账本将无法恢复，是否继续？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const db = new DB('books')
            await db.doc(this.data.id).update({
              isDeleted: true,
              updateTime: new Date()
            })
            eventBus.emit('bookUpdated')
            wx.navigateBack()
          } catch (err) {
            console.error('删除账本失败:', err)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  }
}) 