import DB from '../../utils/db'

Page({
  data: {
    billId: '',
    bookId: '',
    categories: ['餐饮', '交通', '购物', '居住', '娱乐', '医疗', '教育', '人情', '其他'],
    selectedCategory: '',
    amount: '',
    description: '',
    date: '',
    participants: [
      { name: '我', selected: true }
    ],
    showAddMemberModal: false,
    newMemberName: '',
    canSubmit: false
  },

  onLoad(options) {
    this.setData({
      billId: options.id
    })
    this.getBillDetail()
  },

  async getBillDetail() {
    const bill = await DB.getBillDetail(this.data.billId)
    const bookDetail = await DB.getBookDetail(bill.data.bookId)
    
    const participants = bill.data.participants.map(p => ({
      name: p.name,
      selected: true
    }))

    this.setData({
      bookId: bill.data.bookId,
      selectedCategory: bill.data.category,
      amount: bill.data.amount.toString(),
      description: bill.data.description || '',
      date: bill.data.date,
      participants: participants,
      canSubmit: true
    })
  },

  onAmountInput(e) {
    const amount = e.detail.value
    this.setData({
      amount,
      canSubmit: this.checkCanSubmit()
    })
  },

  onDescriptionInput(e) {
    this.setData({
      description: e.detail.value
    })
  },

  onDateChange(e) {
    this.setData({
      date: e.detail.value
    })
  },

  selectCategory(e) {
    this.setData({
      selectedCategory: e.currentTarget.dataset.category
    })
  },

  toggleMember(e) {
    const index = e.currentTarget.dataset.index
    const participants = this.data.participants
    participants[index].selected = !participants[index].selected
    
    this.setData({
      participants,
      canSubmit: this.checkCanSubmit()
    })
  },

  showAddMemberModal() {
    this.setData({
      showAddMemberModal: true,
      newMemberName: ''
    })
  },

  hideAddMemberModal() {
    this.setData({
      showAddMemberModal: false,
      newMemberName: ''
    })
  },

  onInputMemberName(e) {
    this.setData({
      newMemberName: e.detail.value
    })
  },

  addMember() {
    const name = this.data.newMemberName.trim()
    if (!name) {
      wx.showToast({
        title: '请输入成员名称',
        icon: 'none'
      })
      return
    }
    
    const participants = this.data.participants
    participants.push({
      name: name,
      selected: true
    })
    
    this.setData({
      participants,
      showAddMemberModal: false,
      newMemberName: ''
    })
  },

  checkCanSubmit() {
    const { amount, participants } = this.data
    const hasSelectedParticipants = participants.some(p => p.selected)
    return amount > 0 && hasSelectedParticipants
  },

  async submitBill() {
    if (!this.checkCanSubmit()) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    const billData = {
      category: this.data.selectedCategory,
      amount: Number(this.data.amount),
      description: this.data.description,
      date: this.data.date,
      participants: this.data.participants.filter(p => p.selected)
    }

    await DB.updateBill(this.data.billId, billData)
    wx.navigateBack()
  }
}) 