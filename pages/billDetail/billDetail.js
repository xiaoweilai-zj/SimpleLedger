import DB from '../../utils/db'

Page({
  data: {
    bill: null,
    participants: []
  },

  onLoad(options) {
    if (options.id) {
      this.getBillDetail(options.id)
    }
  },

  async getBillDetail(billId) {
    try {
      wx.showLoading({
        title: '加载中...',
        mask: true
      })
      
      // 获取账单详情
      const billRes = await DB.getBillDetail(billId)
      const bill = billRes.data
      
      // 直接使用账单中的参与者信息
      const participants = bill.participants || []

      this.setData({
        bill,
        participants
      })

    } catch (err) {
      console.error('获取账单详情失败:', err)
      wx.showToast({
        title: '获取账单详情失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  }
}) 