// 封面颜色数组
const COVER_COLORS = [
  '#1296db',  // 主题蓝
  '#13c2c2',  // 青色
  '#52c41a',  // 绿色
  '#faad14',  // 黄色
  '#722ed1',  // 紫色
  '#eb2f96',  // 粉色
  '#fa541c',  // 橙色
]

const DB = {
  // 获取数据库实例
  getDB() {
    const app = getApp()
    if (!app || !app.db) {
      throw new Error('数据库未初始化')
    }
    return app.db
  },

  // 通过 openid 获取用户信息
  async getUserByOpenid(openid) {
    const db = this.getDB()
    const { data } = await db.collection('users')
      .where({ _openid: openid })
      .get()
    return data[0] || null
  },

  // 创建新用户
  async createUser(userData) {
    const db = this.getDB()
    return await db.collection('users').add({
      data: userData
    })
  },

  // 更新用户信息
  async updateUser(openid, userData) {
    const db = this.getDB()
    return await db.collection('users')
      .where({ _openid: openid })
      .update({
        data: userData
      })
  },

  // 创建账本
  async createBook(bookData) {
    const db = this.getDB()
    const userInfo = getApp().globalData.userInfo
    
    if (!userInfo || !userInfo._openid) {
      console.error('创建账本失败：用户未登录')
      return null
    }

    try {
      const data = {
        creatorId: userInfo._openid,
        isShared: false,
        isDeleted: false,
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
        members: [{
          _openid: userInfo._openid,
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl
        }],
        ...bookData // 允许传入其他数据覆盖默认值
      }

      console.log('准备创建账本:', data)
      const result = await db.collection('books').add({ data })
      console.log('创建账本结果:', result)
      return result
    } catch (err) {
      console.error('创建账本失败:', err)
      return null
    }
  },

  // 获取账本列表
  async getBooks(userId) {
    const db = this.getDB()
    const _ = db.command
    
    try {
      console.log('开始查询账本, 传入的userId:', userId)
      
      let openid = userId
      if (!openid) {
        const userInfo = getApp().globalData.userInfo
        console.log('从全局获取用户信息:', {
          userInfo,
          hasOpenid: !!userInfo?._openid,
          type: typeof userInfo?._openid
        })
        if (!userInfo || !userInfo._openid) {
          throw new Error('用户未登录')
        }
        openid = userInfo._openid
      }

      console.log('使用openid查询账本:', openid)
      const res = await db.collection('books')
        .where(_.or([
          {
            creatorId: openid,
            isDeleted: _.neq(true)
          },
          {
            'members._openid': openid,
            isDeleted: _.neq(true)
          }
        ]))
        .orderBy('createTime', 'desc')
        .get()
      
      console.log('查询到的账本:', res)
      return res.data || []
    } catch (err) {
      console.error('获取账本列表失败:', err)
      return []
    }
  },

  // 获取账本详情
  async getBookDetail(bookId) {
    const db = this.getDB()
    try {
      const res = await db.collection('books')
        .doc(bookId)
        .get()
      return res
    } catch (err) {
      console.error('获取账本详情失败:', err)
      return null
    }
  },

  // 获取账单详情
  async getBillDetail(billId) {
    const db = this.getDB()
    return await db.collection('bills').doc(billId).get()
  },

  // 添加账单
  async addBill(billData) {
    const db = this.getDB()
    const userInfo = getApp().globalData.userInfo

    if (!userInfo || !userInfo._openid) {
      throw new Error('用户未登录')
    }

    return await db.collection('bills').add({
      data: {
        bookId: billData.bookId,
        category: billData.category,
        amount: billData.amount,
        date: billData.date,
        description: billData.description,
        participants: billData.participants.map(p => ({
          _openid: p._openid,
          nickName: p.nickName,
          avatarUrl: p.avatarUrl
        })),
        splitAmount: billData.amount / billData.participants.length,
        createTime: db.serverDate(),
        creator: {
          _openid: userInfo._openid,
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl
        }
      }
    })
  },

  // 获取账单列表
  async getBills(bookId) {
    const db = this.getDB()
    try {
      const res = await db.collection('bills')
        .where({
          bookId: bookId,
          isDeleted: db.command.neq(true)
        })
        .orderBy('createTime', 'desc')
        .get()
      
      console.log('获取到的账单列表:', res)
      return res.data || []
    } catch (err) {
      console.error('获取账单列表失败:', err)
      return []
    }
  },

  // 根据日期范围获取账单
  async getBillsByDateRange(bookId, startDateStr, endDateStr) {
    const db = this.getDB()
    return await db.collection('bills')
      .where({
        bookId: bookId,
        date: db.command.gte(startDateStr).and(db.command.lte(endDateStr))
      })
      .orderBy('date', 'desc')
      .get()
  },

  // 获取成员统计
  async getMemberStats(bookId) {
    const db = this.getDB()
    // 先获取账本信息以获取成员详情
    const bookDetail = await db.collection('books').doc(bookId).get()
    const memberDetails = bookDetail.data.members
    
    const bills = await db.collection('bills')
      .where({
        bookId: bookId
      })
      .get()
    
    // 统计每个成员的支出
    const memberStats = {}
    bills.data.forEach(bill => {
      const splitAmount = bill.amount / bill.participants.length
      bill.participants.forEach(p => {
        if (!memberStats[p.name]) {
          memberStats[p.name] = 0
        }
        memberStats[p.name] += splitAmount
      })
    })
    
    // 转换为数组格式并添加成员信息
    return Object.entries(memberStats).map(([name, amount]) => {
      const memberDetail = memberDetails.find(m => m.name === name) || {}
      return {
        name,
        avatar: memberDetail.avatar,
        totalAmount: amount.toFixed(2)
      }
    })
  },

  // 删除账单
  async deleteBill(billId) {
    const db = this.getDB()
    return await db.collection('bills').doc(billId).remove()
  },

  // 更新账单
  async updateBill(billId, billData) {
    const db = this.getDB()
    return await db.collection('bills').doc(billId).update({
      data: {
        category: billData.category,
        amount: billData.amount,
        date: billData.date,
        description: billData.description,
        participants: billData.participants.map(p => ({
          name: p.name
        })),
        splitAmount: billData.amount / billData.participants.length,
        updateTime: db.serverDate()
      }
    })
  },

  // 检查用户是否已有账本
  async hasBooks(userId) {
    const db = this.getDB()
    const result = await db.collection('books')
      .where({
        members: userId
      })
      .count()
    return result.total > 0
  },

  // 设置默认账本
  async setDefaultBook(bookId, userId) {
    const db = this.getDB()
    // 先取消所有默认账本
    await db.collection('books')
      .where({
        members: userId,
        isDefault: true
      })
      .update({
        data: {
          isDefault: false
        }
      })
    // 设置新的默认账本
    return await db.collection('books')
      .doc(bookId)
      .update({
        data: {
          isDefault: true
        }
      })
  },

  // 获取统计数据
  async getStatistics(bookId) {
    const db = this.getDB()
    const userInfo = getApp().globalData.userInfo

    if (!userInfo || !userInfo._openid) {
      throw new Error('用户未登录')
    }

    try {
      const bills = await this.getBills(bookId)
      console.log('获取到的账单列表:', bills)
      
      // 计算总支出
      const totalExpense = bills.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0)
      
      // 计算个人支出（我创建的账单总额）
      const myExpense = bills
        .filter(bill => {
          // 检查 creator 字段的有效性
          if (!bill || !bill.creator) return false
          // 兼容两种可能的数据格式
          const creatorId = typeof bill.creator === 'string' ? bill.creator : bill.creator._openid
          return creatorId === userInfo._openid
        })
        .reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0)
      
      // 计算个人应付（我参与的账单分摊金额）
      const myShare = bills
        .filter(bill => {
          // 确保 participants 是数组且包含有效的成员信息
          if (!Array.isArray(bill.participants)) return false
          return bill.participants.some(p => {
            if (!p) return false
            // 兼容两种可能的数据格式
            const participantId = typeof p === 'string' ? p : p._openid
            return participantId === userInfo._openid
          })
        })
        .reduce((sum, bill) => {
          // 确保金额和参与人数都有效
          const amount = Number(bill.amount) || 0
          const participantCount = Array.isArray(bill.participants) ? bill.participants.length : 1
          const splitAmount = participantCount > 0 ? amount / participantCount : 0
          return sum + splitAmount
        }, 0)
      
      // 计算收支情况（正数表示别人欠我的，负数表示我欠别人的）
      const balance = myExpense - myShare

      const result = {
        totalExpense: Number(totalExpense.toFixed(2)),
        myExpense: Number(myExpense.toFixed(2)),
        myShare: Number(myShare.toFixed(2)),
        balance: Number(balance.toFixed(2))
      }

      console.log('统计结果:', result)
      return result
    } catch (err) {
      console.error('获取统计数据失败:', err)
      // 返回默认值而不是抛出错误
      return {
        totalExpense: 0,
        myExpense: 0,
        myShare: 0,
        balance: 0
      }
    }
  }
}

export default DB 