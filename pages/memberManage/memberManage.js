import DB from '../../utils/db'

Page({
  data: {
    bookId: '',
    members: [],
    newMemberName: '',
    showAddForm: false,
    isLoading: false
  },

  onLoad(options) {
    this.setData({
      bookId: options.bookId
    })
    this.getMembers()
  },

  async getMembers() {
    try {
      this.setData({ isLoading: true })
      const bookDetail = await DB.getBookDetail(this.data.bookId)
      this.setData({
        members: bookDetail.data.members,
        isLoading: false
      })
    } catch (err) {
      console.error('获取成员列表失败:', err)
      this.setData({ isLoading: false })
    }
  },

  onNameInput(e) {
    this.setData({
      newMemberName: e.detail.value
    })
  },

  showAddMemberForm() {
    this.setData({
      showAddForm: true
    })
  },

  async addMember() {
    if (!this.data.newMemberName) return

    await DB.addMember(this.data.bookId, {
      name: this.data.newMemberName,
      avatar: ''  // 可以添加默认头像
    })

    this.setData({
      newMemberName: '',
      showAddForm: false
    })
    
    this.getMembers()
  },

  async deleteMember(e) {
    const memberId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '提示',
      content: '确定要删除该成员吗？',
      success: async (res) => {
        if (res.confirm) {
          await DB.removeMember(this.data.bookId, memberId)
          this.getMembers()
        }
      }
    })
  }
}) 