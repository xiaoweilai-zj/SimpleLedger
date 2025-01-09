Page({
  data: {
    isBookListVisible: false,
    // ... 其他数据
  },

  showBookList() {
    this.setData({
      isBookListVisible: !this.data.isBookListVisible
    })
    // 处理账本列表的显示逻辑
  }
  // ... 其他方法
}) 