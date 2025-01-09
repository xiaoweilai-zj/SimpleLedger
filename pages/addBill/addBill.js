import DB from '../../utils/db'
import eventBus from '../../utils/eventBus'

// 防抖函数
function debounce(fn, delay = 500) {
  let timer = null
  return function(...args) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

Page({
  data: {
    bookId: '',
    categories: ['餐饮', '交通', '购物', '居住', '娱乐', '医疗', '教育', '人情', '其他'],
    selectedCategory: '餐饮',  // 默认选择餐饮
    amount: '',
    date: '',
    description: '',
    participants: [
      { name: '我', selected: true }
    ],
    showAddMemberModal: false,
    newMemberName: '',
    canSubmit: false,  // 添加是否可提交的状态
    isSubmitting: false  // 添加提交中状态
  },

  // 监听金额输入
  onAmountInput(e) {
    this.setData({
      amount: e.detail.value,
      canSubmit: this.checkCanSubmit()
    })
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { amount, participants } = this.data
    const hasSelectedParticipants = participants.some(p => p.selected)
    return amount > 0 && hasSelectedParticipants
  },

  // 监听日期选择
  onDateChange(e) {
    this.setData({
      date: e.detail.value
    })
  },

  // 监听备注输入
  onDescriptionInput(e) {
    this.setData({
      description: e.detail.value
    })
  },

  onLoad(options) {
    if (options.bookId) {
      this.setData({
        bookId: options.bookId,
        date: new Date().toISOString().split('T')[0]
      })
    }
    // 创建防抖后的提交函数
    this.debouncedSubmit = debounce(this.handleSubmit.bind(this))
  },

  // 选择分类
  selectCategory(e) {
    this.setData({
      selectedCategory: e.currentTarget.dataset.category
    })
  },

  // 切换成员选中状态
  toggleMember(e) {
    const index = e.currentTarget.dataset.index
    const participants = this.data.participants
    participants[index].selected = !participants[index].selected
    this.setData({ 
      participants,
      canSubmit: this.checkCanSubmit()
    })
  },

  // 显示添加成员弹窗
  showAddMemberModal() {
    this.setData({
      showAddMemberModal: true,
      newMemberName: ''
    })
  },

  // 隐藏添加成员弹窗
  hideAddMemberModal() {
    this.setData({
      showAddMemberModal: false,
      newMemberName: ''
    })
  },

  // 监听成员名称输入
  onInputMemberName(e) {
    this.setData({
      newMemberName: e.detail.value
    })
  },

  // 添加新成员
  addMember() {
    const name = this.data.newMemberName.trim()
    if (!name) {
      wx.showToast({
        title: '请输入成员名称',
        icon: 'none'
      })
      return
    }

    // 检查是否已存在该成员
    if (this.data.participants.some(p => p.name === name)) {
      wx.showToast({
        title: '该成员已存在',
        icon: 'none'
      })
      return
    }

    // 添加新成员
    const participants = this.data.participants
    participants.push({
      name: name,
      selected: true
    })

    this.setData({
      participants,
      showAddMemberModal: false,
      newMemberName: '',
      canSubmit: this.checkCanSubmit()
    })
  },

  async submitBill() {
    // 调用防抖后的提交函数
    this.debouncedSubmit()
  },

  // 实际的提交处理函数
  async handleSubmit() {
    // 检查是否可提交且未在提交中
    if (!this.data.canSubmit || this.data.isSubmitting) return
    
    // 表单验证
    if (!this.data.amount) {
      wx.showToast({
        title: '请输入金额',
        icon: 'none'
      })
      return
    }

    // 检查是否有选中的成员
    const selectedParticipants = this.data.participants.filter(p => p.selected)
    if (selectedParticipants.length === 0) {
      wx.showToast({
        title: '请选择参与成员',
        icon: 'none'
      })
      return
    }
    
    try {
      // 设置提交中状态
      this.setData({ isSubmitting: true })

      const billData = {
        bookId: this.data.bookId,
        category: this.data.selectedCategory,
        amount: Number(this.data.amount),
        date: this.data.date,
        description: this.data.description,
        participants: selectedParticipants,
        creator: getApp().globalData.userInfo.openId
      }
      
      await DB.addBill(billData)
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      })
      // 发送账单更新事件
      eventBus.emit('billUpdated')
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (err) {
      console.error('添加账单失败:', err)
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      })
    } finally {
      // 重置提交中状态
      this.setData({ isSubmitting: false })
    }
  }
}) 