#!/usr/bin/env python3
"""
排序算法使用示例
"""

# 导入排序算法
from sort_algorithms import (
    bubble_sort, selection_sort, insertion_sort,
    quick_sort, merge_sort, heap_sort
)


def main():
    """主函数"""
    print("排序算法使用示例")
    print("=" * 60)
    
    # 示例1：基本使用
    print("\n1. 基本使用示例:")
    numbers = [64, 34, 25, 12, 22, 11, 90]
    print(f"   原始数组: {numbers}")
    
    # 使用不同的排序算法
    sorted_bubble = bubble_sort(numbers.copy())
    print(f"   冒泡排序结果: {sorted_bubble}")
    
    sorted_quick = quick_sort(numbers.copy())
    print(f"   快速排序结果: {sorted_quick}")
    
    sorted_merge = merge_sort(numbers.copy())
    print(f"   归并排序结果: {sorted_merge}")
    
    # 示例2：自定义比较函数（通过lambda）
    print("\n2. 降序排序示例:")
    # 我们可以修改算法来支持降序，这里使用快速排序的变体
    def quick_sort_desc(arr):
        """降序快速排序"""
        if len(arr) <= 1:
            return arr
        
        pivot = arr[len(arr) // 2]
        left = [x for x in arr if x > pivot]  # 大于pivot的放左边
        middle = [x for x in arr if x == pivot]
        right = [x for x in arr if x < pivot]  # 小于pivot的放右边
        
        return quick_sort_desc(left) + middle + quick_sort_desc(right)
    
    print(f"   原始数组: {numbers}")
    print(f"   降序排序: {quick_sort_desc(numbers.copy())}")
    
    # 示例3：字符串排序
    print("\n3. 字符串排序示例:")
    words = ["banana", "apple", "cherry", "date", "elderberry"]
    print(f"   原始字符串数组: {words}")
    
    # 字符串也可以使用相同的排序算法
    sorted_words = quick_sort(words.copy())
    print(f"   排序后的字符串: {sorted_words}")
    
    # 示例4：对象排序（按特定属性）
    print("\n4. 对象排序示例:")
    class Person:
        def __init__(self, name, age):
            self.name = name
            self.age = age
        
        def __repr__(self):
            return f"{self.name}({self.age})"
    
    people = [
        Person("Alice", 30),
        Person("Bob", 25),
        Person("Charlie", 35),
        Person("David", 28)
    ]
    
    print(f"   原始人员列表: {people}")
    
    # 按年龄排序
    people_by_age = sorted(people, key=lambda p: p.age)
    print(f"   按年龄排序: {people_by_age}")
    
    # 按姓名排序
    people_by_name = sorted(people, key=lambda p: p.name)
    print(f"   按姓名排序: {people_by_name}")
    
    # 示例5：性能比较
    print("\n5. 性能比较（小规模）:")
    import random
    import time
    
    test_data = [random.randint(1, 1000) for _ in range(100)]
    
    algorithms = [
        ("冒泡排序", bubble_sort),
        ("插入排序", insertion_sort),
        ("快速排序", quick_sort),
        ("归并排序", merge_sort),
    ]
    
    for name, func in algorithms:
        data_copy = test_data.copy()
        start = time.time()
        func(data_copy)
        end = time.time()
        print(f"   {name}: {(end - start) * 1000:.2f} 毫秒")
    
    # 示例6：稳定性测试
    print("\n6. 排序稳定性示例:")
    # 具有相同值的元素应保持原始顺序（对于稳定排序算法）
    items = [
        ("apple", 3),
        ("banana", 2),
        ("cherry", 3),
        ("date", 1),
        ("elderberry", 2)
    ]
    
    # 按数字排序
    def sort_by_number(item):
        return item[1]
    
    sorted_items = sorted(items, key=sort_by_number)
    print(f"   原始数据: {items}")
    print(f"   按数字排序: {sorted_items}")
    print("   注意：稳定排序会保持相同数字的原始顺序")


if __name__ == "__main__":
    main()