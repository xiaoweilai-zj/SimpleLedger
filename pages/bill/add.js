data: {
  isSubmitting: false,  // 是否正在提交
  // ... 其他已有的 data
},

async submitBill() {
  // 如果正在提交中，直接返回
  if (this.data.isSubmitting) {
    return;
  }

  // 表单验证
  if (!this.data.amount) {
    wx.showToast({
      title: '请输入金额',
      icon: 'none'
    })
    return
  }

  if (!this.data.category) {
    wx.showToast({
      title: '请选择分类',
      icon: 'none'
    })
    return
  }

  // 设置提交状态为true
  this.setData({
    isSubmitting: true
  });

  try {
    const bill = {
      bookId: this.data.currentBook._id,
      amount: this.data.amount,
      category: this.data.category,
      description: this.data.description || '',
      date: this.data.date,
      payer: this.data.currentBook.creator,
      participants: this.data.currentBook.members
    }

    await DB.addBill(bill)
    
    // 发送账单更新事件
    eventBus.emit('billUpdated')
    
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    })

    // 返回上一页
    wx.navigateBack()
  } catch (err) {
    console.error('添加账单失败:', err)
    wx.showToast({
      title: '添加失败',
      icon: 'none'
    })
  } finally {
    // 无论成功失败，都将提交状态重置
    this.setData({
      isSubmitting: false
    });
  }
}, 