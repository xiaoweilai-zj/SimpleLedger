import DB from '../../utils/db'
import eventBus from '../../utils/eventBus'

Page({
  data: {
    showDrawer: false,
    books: [],
    currentBook: null,
    bills: [],
    showAddBookModal: false,
    newBookName: '',
    startX: 0,
    moveX: 0,
    drawerAnimation: null,
    isLoading: false
  },

  onLoad() {
    // 检查是否有默认账本，没有则创建
    this.checkDefaultBook()
    // 创建动画实例
    this.drawerAnim = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease'
    })
  },

  onShow() {
    // 检查登录状态并获取账单
    const app = getApp()
    if (!app.globalData.userInfo) {
      app.checkLogin().then(() => {
        this.checkDefaultBook()
      })
    } else {
      this.checkDefaultBook()
    }
  },

  async checkDefaultBook() {
    try {
      const userInfo = getApp().globalData.userInfo
      if (!userInfo) {
        console.log('用户未登录，跳过检查默认账本')
        return
      }

      console.log('开始检查默认账本')
      const books = await DB.getBooks(userInfo._openid)
      console.log('获取到的账本列表:', books)

      if (Array.isArray(books) && books.length > 0) {
        const defaultBook = books.find(b => b.isDefault) || books[0]
        this.setData({ 
          books: books,
          currentBook: defaultBook
        }, () => {
          if (this.data.currentBook) {
            this.getBills()
          }
        })
      } else {
        // 如果没有账本，创建一个默认账本
        const defaultBookData = {
          name: '默认账本',
          isDefault: true,
          cover: this.getRandomCover()
        }
        const result = await DB.createBook(defaultBookData)
        if (result) {
          this.checkDefaultBook() // 重新检查以获取新创建的账本
        }
      }
    } catch (err) {
      console.error('检查默认账本失败:', err)
    }
  },

  async getBills() {
    if (!this.data.currentBook) {
      console.log('没有当前账本，跳过获取账单')
      return
    }
    
    try {
      wx.showLoading({
        title: '加载中...',
        mask: true
      })

      const bills = await DB.getBills(this.data.currentBook._id)
      console.log('获取到的账单列表:', bills)

      this.setData({
        bills: bills || []
      }, () => {
        console.log('设置后的账单列表:', this.data.bills)
        console.log('账单列表长度:', this.data.bills.length)
      })
    } catch (err) {
      console.error('获取账单失败:', err)
      wx.showToast({
        title: '获取账单失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  async getBooks() {
    const userInfo = getApp().globalData.userInfo
    if (!userInfo) return
    
    try {
      const res = await DB.getBooks(userInfo.openId)
      this.setData({
        books: res.data,
        currentBook: res.data.find(b => b.isDefault) || res.data[0]
      }, () => {
        if (this.data.currentBook) {
          this.getBills()
        }
      })
    } catch (err) {
      console.error('获取账本失败:', err)
      wx.showToast({
        title: '获取账本失败',
        icon: 'none'
      })
    }
  },

  showBookDrawer() {
    this.setData({ showDrawer: true })
    setTimeout(() => {
      this.drawerAnim.translateX(0).step()
      this.setData({
        drawerAnimation: this.drawerAnim.export()
      })
    }, 0)
  },

  hideBookDrawer() {
    this.drawerAnim.translateX('100%').step()
    this.setData({
      drawerAnimation: this.drawerAnim.export()
    })
    setTimeout(() => {
      this.setData({ showDrawer: false })
    }, 300)
  },

  switchBook(e) {
    const bookId = e.currentTarget.dataset.id
    const book = this.data.books.find(b => b._id === bookId)
    if (book) {
      // 先更新全局状态
      getApp().globalData.currentBook = book
      
      this.setData({
        currentBook: book,
        showDrawer: false
      }, () => {
        this.getBills()
      })
      
      // 使用事件总线通知其他页面
      eventBus.emit('bookChanged', book)
    }
  },

  showAddBillModal() {
    if (!getApp().globalData.userInfo) {
      getApp().checkLogin()
      return
    }
    
    if (!this.data.currentBook) {
      wx.showToast({
        title: '请先选择账本',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/addBill/addBill?bookId=' + this.data.currentBook._id
    })
  },

  goToBillDetail(e) {
    const billId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/billDetail/billDetail?id=${billId}`
    })
  },

  showAddBookModal() {
    this.setData({
      showAddBookModal: true,
      newBookName: ''
    })
  },

  hideAddBookModal() {
    this.setData({
      showAddBookModal: false,
      newBookName: ''
    })
  },

  onInputBookName(e) {
    this.setData({
      newBookName: e.detail.value
    })
  },

  async createBook() {
    const name = this.data.newBookName.trim()
    if (!name) {
      wx.showToast({
        title: '请输入账本名称',
        icon: 'none'
      })
      return
    }

    try {
      const userInfo = getApp().globalData.userInfo
      const bookData = {
        name: name,
        members: [userInfo.openId],
        creator: userInfo.openId,
        cover: this.getRandomCover()
      }

      await DB.createBook(bookData)
      
      // 刷新账本列表
      await this.getBooks()
      
      this.setData({
        showAddBookModal: false,
        newBookName: ''
      })

      wx.showToast({
        title: '创建成功',
        icon: 'success'
      })
    } catch (err) {
      console.error('创建账本失败:', err)
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      })
    }
  },

  // 获取随机封面颜色
  getRandomCover() {
    const colors = [
      '#1296db',  // 主题蓝
      '#13c2c2',  // 青色
      '#52c41a',  // 绿色
      '#faad14',  // 黄色
      '#722ed1',  // 紫色
      '#eb2f96',  // 粉色
      '#fa541c',  // 橙色
    ]
    const index = Math.floor(Math.random() * colors.length)
    return colors[index]
  },

  // 触摸开始
  touchStart(e) {
    const touch = e.touches[0]
    this.setData({
      startX: touch.clientX
    })
  },

  // 触摸移动
  touchMove(e) {
    const touch = e.touches[0]
    const moveX = touch.clientX - this.data.startX
    const index = e.currentTarget.dataset.index
    
    // 只允许向左滑动
    if (moveX < 0) {
      const bills = this.data.bills
      bills[index].showActions = true
      this.setData({ bills })
    }
  },

  // 触摸结束
  touchEnd(e) {
    const touch = e.changedTouches[0]
    const moveX = touch.clientX - this.data.startX
    const index = e.currentTarget.dataset.index
    
    const bills = this.data.bills
    // 如果滑动距离不够，恢复原位
    if (moveX > -50) {
      bills[index].showActions = false
      this.setData({ bills })
    }
  },

  // 删除账单
  async deleteBill(e) {
    const billId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '提示',
      content: '确定要删除这条账单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await DB.deleteBill(billId)
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            // 重新获取账单列表
            this.getBills()
          } catch (err) {
            console.error('删除账单失败:', err)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  goToEditBill(e) {
    const billId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/addBill/addBill?id=${billId}&bookId=${this.data.currentBook._id}`
    })
  },

  // 设置默认账本
  async setDefaultBook(e) {
    const bookId = e.currentTarget.dataset.id
    const userInfo = getApp().globalData.userInfo
    
    try {
      await DB.setDefaultBook(bookId, userInfo.openId)
      // 刷新账本列表
      this.getBooks()
      wx.showToast({
        title: '设置成功',
        icon: 'success'
      })
    } catch (err) {
      console.error('设置默认账本失败:', err)
      wx.showToast({
        title: '设置失败',
        icon: 'none'
      })
    }
  },

  async login() {
    try {
      const { userInfo } = await wx.getUserProfile({
        desc: '用于完善用户资料'
      })
      
      // 调用云函数登录，并传递用户信息
      const { result } = await wx.cloud.callFunction({
        name: 'login',
        data: {
          userInfo: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl
          }
        }
      })

      if (result.error) {
        throw new Error(result.error)
      }

      // 保存用户信息到全局
      getApp().globalData.userInfo = {
        openId: result.openId,
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl
      }

      // 登录成功后的处理
      this.checkDefaultBook()
    } catch (err) {
      console.error('登录失败:', err)
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      })
    }
  }
}) 