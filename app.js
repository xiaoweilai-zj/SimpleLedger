import DB from './utils/db'

App({
  cloud: null,
  async onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    wx.cloud.init({
      env: wx.cloud.DYNAMIC_CURRENT_ENV,
      traceUser: true,
    })

    this.cloud = wx.cloud
    this.db = wx.cloud.database()
  },

  // 添加 onShow 方法
  async onShow() {
    // 检查缓存中的 _openid
    const openid = wx.getStorageSync('_openid')
    console.log('检查缓存中的 openid:', openid)
    
    if (openid && !this.globalData.userInfo) {
      console.log('有 openid 但没有用户信息，尝试自动登录')
      const success = await this.autoLogin(openid)
      // 通知页面更新
      if (success) {
        const pages = getCurrentPages()
        const currentPage = pages[pages.length - 1]
        if (currentPage && currentPage.onShow) {
          currentPage.onShow()
        }
      }
    }
  },

  // 自动登录：通过缓存的 _openid 获取用户信息
  async autoLogin(openid) {
    try {
      console.log(openid,"opennnnn")
      // 通过 _openid 从数据库获取最新用户信息
      const { data } = await this.db.collection('users')
        .where({ _openid: openid })
        .get()
      
      if (!data || data.length === 0) {
        console.log('未找到用户信息，需要重新登录')
        wx.removeStorageSync('_openid')
        wx.removeStorageSync('userInfo')
        return false
      }

      // 设置全局用户信息
      this.globalData.userInfo = data[0]
      // 更新本地存储的用户信息
      wx.setStorageSync('userInfo', data[0])
      console.log('自动登录成功:', this.globalData.userInfo)

      // 初始化用户账本
      await this.initUserBook(this.globalData.userInfo)
      return true
    } catch (err) {
      console.error('自动登录失败:', err)
      wx.removeStorageSync('_openid')
      wx.removeStorageSync('userInfo')
      return false
    }
  },

  // 用户手动登录（第一次登录）
  async login() {
    try {
      // 1. 获取用户信息（头像、昵称）
      let userInfo;
      try {
        const res = await wx.getUserProfile({
          desc: '用于完善会员资料'
        })
        userInfo = res.userInfo
      } catch (err) {
        console.log('用户拒绝授权:', err)
        wx.showToast({
          title: '需要您的授权才能使用',
          icon: 'none'
        })
        return false
      }

      // 2. 获取用户 openid
      const { result } = await wx.cloud.callFunction({
        name: 'login'
      })
      console.log(result, "结果")
      if (!result || !result.openid) {
        throw new Error('登录失败')
      }

      const openid = result.openid

      // 3. 创建用户记录
      userInfo = {
        _openid: openid,
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        createTime: this.db.serverDate()
      }
      
      await this.db.collection('users').add({
        data: userInfo
      })

      // 4. 保存用户信息到本地缓存
      wx.setStorageSync('_openid', openid)
      wx.setStorageSync('userInfo', userInfo)

      // 5. 设置全局用户信息
      this.globalData.userInfo = userInfo

      // 6. 初始化用户账本
      const success = await this.initUserBook(userInfo)
      if (!success) {
        throw new Error('初始化账本失败')
      }

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
      
      return true
    } catch (err) {
      console.error('登录失败:', err)
      wx.removeStorageSync('_openid')
      wx.removeStorageSync('userInfo')
      this.globalData.userInfo = null
      
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none'
      })
      
      return false
    }
  },

  async initUserBook(userInfo) {
    if (!userInfo || !userInfo._openid) {
      console.error('初始化账本失败：用户信息不完整')
      return false
    }

    try {
      console.log('开始初始化用户账本:', userInfo)
      const books = await DB.getBooks(userInfo._openid)
      console.log('获取到的账本列表:', books)
      
      if (Array.isArray(books) && books.length > 0) {
        // 获取默认账本或第一个账本
        const defaultBook = books.find(b => b.isDefault) || books[0]
        this.globalData.currentBook = defaultBook
        console.log('设置当前账本:', defaultBook)
        return true
      }

      // 第一次登录，创建默认账本
      const result = await DB.createBook({
        name: '默认账本',
        isDefault: true,
        members: [{
          _openid: userInfo._openid,
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl
        }]
      })

      if (result && result._id) {
        const newBook = await DB.getBookDetail(result._id)
        if (newBook && newBook.data) {
          this.globalData.currentBook = newBook.data
          console.log('创建默认账本成功:', newBook.data)
          return true
        }
      }
      
      console.error('创建账本失败')
      return false
    } catch (err) {
      console.error('初始化账本失败:', err)
      return false
    }
  },

  async checkLogin() {
    if (this.globalData.userInfo) return this.globalData.userInfo

    try {
      const { result } = await wx.cloud.callFunction({
        name: 'login'
      })

      if (result.error) {
        throw new Error(result.error)
      }

      this.globalData.userInfo = result.userInfo
      return result.userInfo
    } catch (err) {
      console.error('登录失败:', err)
      return null
    }
  },

  globalData: {
    userInfo: null,
    currentBook: null
  }
}) 