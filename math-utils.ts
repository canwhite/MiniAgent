/**
 * 数学工具函数集合
 * 提供基本的数学运算功能
 */

/**
 * 两数相加
 * @param a - 第一个数字
 * @param b - 第二个数字
 * @returns 两个数字的和
 */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * 两数相乘
 * @param a - 第一个数字
 * @param b - 第二个数字
 * @returns 两个数字的乘积
 */
export function multiply(a: number, b: number): number {
  return a * b;
}

/**
 * 计算阶乘
 * @param n - 要计算阶乘的非负整数
 * @returns n 的阶乘
 * @throws {Error} 如果 n 是负数
 */
export function factorial(n: number): number {
  if (n < 0) {
    throw new Error('阶乘只能计算非负整数');
  }
  
  if (n === 0 || n === 1) {
    return 1;
  }
  
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  
  return result;
}

/**
 * 示例使用
 * 取消下面的注释来测试函数
 */
/*
console.log('add(2, 3):', add(2, 3)); // 5
console.log('multiply(4, 5):', multiply(4, 5)); // 20
console.log('factorial(5):', factorial(5)); // 120
*/