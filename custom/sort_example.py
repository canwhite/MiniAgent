"""
排序算法使用示例
"""

from sorting_algorithms import *

def main():
    print("排序算法使用示例")
    print("=" * 50)
    
    # 示例1：基本使用
    arr = [64, 34, 25, 12, 22, 11, 90]
    print(f"原始数组: {arr}")
    
    # 使用不同的排序算法
    print("\n1. 冒泡排序:")
    sorted_bubble = bubble_sort(arr.copy())
    print(f"   结果: {sorted_bubble}")
    
    print("\n2. 快速排序:")
    sorted_quick = quick_sort(arr.copy())
    print(f"   结果: {sorted_quick}")
    
    print("\n3. 归并排序:")
    sorted_merge = merge_sort(arr.copy())
    print(f"   结果: {sorted_merge}")
    
    print("\n4. 堆排序:")
    sorted_heap = heap_sort(arr.copy())
    print(f"   结果: {sorted_heap}")
    
    # 示例2：自定义比较
    print("\n" + "=" * 50)
    print("自定义排序示例（按绝对值排序）:")
    
    def absolute_value_sort(arr):
        """按绝对值排序"""
        return sorted(arr, key=lambda x: abs(x))
    
    numbers = [-5, 3, -1, 4, -2, 0]
    print(f"原始数组: {numbers}")
    print(f"按绝对值排序: {absolute_value_sort(numbers)}")
    
    # 示例3：字符串排序
    print("\n" + "=" * 50)
    print("字符串排序示例:")
    
    words = ["banana", "apple", "cherry", "date", "blueberry"]
    print(f"原始单词列表: {words}")
    print(f"按字母顺序排序: {sorted(words)}")
    print(f"按长度排序: {sorted(words, key=len)}")
    
    # 示例4：对象排序
    print("\n" + "=" * 50)
    print("对象排序示例:")
    
    class Student:
        def __init__(self, name, score):
            self.name = name
            self.score = score
        
        def __repr__(self):
            return f"{self.name}: {self.score}"
    
    students = [
        Student("Alice", 85),
        Student("Bob", 92),
        Student("Charlie", 78),
        Student("David", 95),
    ]
    
    print("学生列表:")
    for student in students:
        print(f"  {student}")
    
    # 按分数排序
    sorted_students = sorted(students, key=lambda s: s.score, reverse=True)
    print("\n按分数降序排序:")
    for student in sorted_students:
        print(f"  {student}")


if __name__ == "__main__":
    main()