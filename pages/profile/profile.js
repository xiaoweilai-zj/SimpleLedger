import { DEFAULT_AVATAR, getRandomNickname } from '../../utils/constants'
import DB from '../../utils/db'

Page({
  data: {
    userInfo: null,
    showLoginModal: false,
    tempAvatar: '',
    tempNickName: '',
    tempOpenid: null,
  },

  onLoad() {
    // 检查本地存储的 _openid
    const openid = wx.getStorageSync('_openid')
    if (openid) {
      this.getUserInfoByOpenid(openid)
    }
  },

  // 通过 openid 获取用户信息
  async getUserInfoByOpenid(openid) {
    try {
      const userInfo = await DB.getUserByOpenid(openid)
      if (userInfo) {
        this.setData({ userInfo })
        getApp().globalData.userInfo = userInfo
        return true
      }
      return false
    } catch (err) {
      console.error('获取用户信息失败:', err)
      return false
    }
  },

  async showLoginModal() {
    wx.showLoading({
      title: '登录中...'
    })

    try {
      // 获取 openid
      const { result } = await wx.cloud.callFunction({
        name: 'login'
      })
      console.log('云函数返回结果:', result)

      if (!result || result.code !== 0 || !result.data || !result.data.openid) {
        throw new Error(result?.msg || '获取用户标识失败')
      }

      const openid = result.data.openid

      // 检查用户是否已存在
      const userInfo = await DB.getUserByOpenid(openid)

      if (userInfo) {
        // 已存在用户，直接登录
        getApp().globalData.userInfo = userInfo
        wx.setStorageSync('_openid', openid)
        
        this.setData({ userInfo })

        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
      } else {
        // 新用户，显示登录弹窗
        this.tempOpenid = openid
        this.setData({
          showLoginModal: true,
          tempAvatar: '',
          tempNickName: ''
        })
      }
    } catch (err) {
      console.error('登录失败:', err)
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  hideLoginModal() {
    this.setData({
      showLoginModal: false,
      tempAvatar: '',
      tempNickName: ''
    })
  },

  onChooseAvatar(e) {
    this.setData({
      tempAvatar: e.detail.avatarUrl
    })
  },

  onInputNickname(e) {
    this.setData({
      tempNickName: e.detail.value
    })
  },

  async handleLogin() {
    if (!this.data.tempAvatar || !this.data.tempNickName) {
      wx.showToast({
        title: '请先获取头像和昵称',
        icon: 'none'
      })
      return
    }

    if (!this.tempOpenid) {
      wx.showToast({
        title: '登录状态异常，请重试',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '登录中...'
    })

    try {
      // 创建新用户
      await DB.createUser({
        _openid: this.tempOpenid,
        nickName: this.data.tempNickName,
        avatarUrl: this.data.tempAvatar,
        createTime: DB.getDB().serverDate()
      })

      // 获取完整的用户信息
      const success = await this.getUserInfoByOpenid(this.tempOpenid)
      if (!success) {
        throw new Error('获取用户信息失败')
      }

      // 保存 openid 到本地
      wx.setStorageSync('_openid', this.tempOpenid)
      
      this.setData({
        showLoginModal: false
      })

      // 清除临时 openid
      this.tempOpenid = null
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
    } catch (err) {
      console.error('登录失败:', err)
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  logout() {
    getApp().globalData.userInfo = null
    wx.removeStorageSync('_openid')
    this.setData({ userInfo: null })
    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    })
  },

  onShow() {
    // 检查本地存储的 _openid
    const openid = wx.getStorageSync('_openid')
    if (openid && !this.data.userInfo) {
      this.getUserInfoByOpenid(openid)
    }
  },

  goToAbout() {
    wx.showModal({
      title: 'AA记账',
      content: '一个简单的AA记账小程序\n版本：1.0.0',
      showCancel: false
    })
  },

  showLogoutConfirm() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          this.logout()
        }
      }
    })
  }
}) 