// pages/bookDetail/bookDetail.js
import DB from '../../utils/db'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    bookId: '',
    bookInfo: null,
    bills: [],
    totalAmount: '0.00',
    averageAmount: '0.00',
    showModal: false,
    newBill: {
      amount: '',
      description: ''
    },
    isLoading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      bookId: options.id
    })
    this.getBookInfo()
    this.getBills()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 检查登录状态
    getApp().checkLogin()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  async getBookInfo() {
    try {
      wx.showLoading({
        title: '加载中...',
        mask: true
      })
      const res = await DB.getBookDetail(this.data.bookId)
      this.setData({
        bookInfo: res.data
      })
    } catch (err) {
      console.error('获取账本详情失败:', err)
    } finally {
      wx.hideLoading()
    }
  },

  async getBills() {
    const res = await DB.getBills(this.data.bookId)
    const bills = res.data
    
    // 计算总金额和人均
    let total = 0
    bills.forEach(bill => {
      total += Number(bill.amount)
    })
    
    this.setData({
      bills,
      totalAmount: total.toFixed(2),
      averageAmount: (total / this.data.bookInfo.members.length).toFixed(2)
    })
  },

  showAddBillModal() {
    // 添加账单前也检查登录状态
    if (!getApp().globalData.userInfo) {
      getApp().checkLogin()
      return
    }
    this.setData({
      showModal: true
    })
  },

  hideModal() {
    this.setData({
      showModal: false,
      newBill: {
        amount: '',
        description: ''
      }
    })
  },

  onAmountInput(e) {
    this.setData({
      'newBill.amount': e.detail.value
    })
  },

  onDescInput(e) {
    this.setData({
      'newBill.description': e.detail.value
    })
  },

  async addBill() {
    const { amount, description } = this.data.newBill
    
    if (!amount) {
      wx.showToast({
        title: '请输入金额',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '添加中...'
    })

    try {
      await DB.addBill({
        bookId: this.data.bookId,
        amount: Number(amount),
        description,
        date: new Date().toISOString().split('T')[0],
        participants: this.data.bookInfo.members.map(m => m._id)
      })

      this.hideModal()
      this.getBills()
      
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      })
    } catch (err) {
      console.error('添加账单失败:', err)
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  goToBillDetail(e) {
    const billId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/billDetail/billDetail?id=${billId}`
    })
  },

  goToMembers() {
    wx.navigateTo({
      url: `/pages/memberManage/memberManage?bookId=${this.data.bookId}`
    })
  },

  goToStatistics() {
    wx.navigateTo({
      url: `/pages/statistics/statistics?bookId=${this.data.bookId || ''}`
    })
  }
})