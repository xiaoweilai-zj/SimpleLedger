const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    console.log('wxContext:', wxContext)  // 添加日志

    // 确保能获取到 OPENID
    if (!wxContext.OPENID) {
      console.error('未能获取到 OPENID')  // 添加日志
      return {
        code: -1,
        msg: '获取用户标识失败'
      }
    }

    // 返回用户标识信息
    return {
      code: 0,
      data: {
        openid: wxContext.OPENID,
        unionid: wxContext.UNIONID || '',
        appid: wxContext.APPID || ''
      }
    }
  } catch (err) {
    console.error('云函数执行错误:', err)  // 添加日志
    return {
      code: -1,
      msg: err.message || '云函数执行失败'
    }
  }
} 