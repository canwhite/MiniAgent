#!/usr/bin/env python3
"""
搜索罪行AI相关信息的脚本
"""

import requests
import json
import re

def search_google_alternative(query):
    """使用公共API搜索信息"""
    print(f"🔍 搜索: {query}")
    print("=" * 50)
    
    # 尝试使用Wikipedia API
    try:
        wiki_url = f"https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch={query}&srlimit=5"
        response = requests.get(wiki_url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'query' in data and 'search' in data['query']:
                results = data['query']['search']
                if results:
                    print("📚 Wikipedia 搜索结果:")
                    for i, result in enumerate(results, 1):
                        print(f"{i}. {result['title']}")
                        print(f"   摘要: {result['snippet']}")
                        print()
                    return True
    except Exception as e:
        print(f"Wikipedia搜索失败: {e}")
    
    # 尝试使用其他公共API
    try:
        # 使用公共知识库API
        api_url = f"https://api.publicapis.org/entries?title={query}"
        response = requests.get(api_url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'entries' in data and data['entries']:
                print("📊 相关API信息:")
                for i, entry in enumerate(data['entries'][:3], 1):
                    print(f"{i}. {entry['API']}")
                    print(f"   描述: {entry['Description']}")
                    print(f"   链接: {entry['Link']}")
                    print()
                return True
    except Exception as e:
        print(f"API搜索失败: {e}")
    
    return False

def get_crime_ai_info():
    """获取罪行AI相关信息"""
    queries = [
        "AI crime prediction",
        "人工智能犯罪检测",
        "machine learning crime prevention",
        "犯罪预测算法",
        "AI in law enforcement"
    ]
    
    all_results = []
    
    for query in queries:
        print(f"\n搜索查询: {query}")
        print("-" * 40)
        
        # 这里可以添加实际的搜索逻辑
        # 由于API限制，我们提供一些已知信息
        
        if "AI crime prediction" in query:
            print("1. 芝加哥警察局使用预测性警务算法")
            print("   用于预测犯罪热点区域")
            print("   基于历史犯罪数据和环境因素")
            
        elif "人工智能犯罪检测" in query:
            print("2. 中国公安部门使用AI进行面部识别")
            print("   用于追踪犯罪嫌疑人")
            print("   在公共场所部署智能监控系统")
            
        elif "machine learning crime prevention" in query:
            print("3. 机器学习在犯罪预防中的应用")
            print("   分析社交媒体数据识别潜在威胁")
            print("   预测个人犯罪风险评分")
            
        elif "犯罪预测算法" in query:
            print("4. PredPol等预测性警务系统")
            print("   使用历史犯罪数据预测未来犯罪")
            print("   存在算法偏见争议")
            
        elif "AI in law enforcement" in query:
            print("5. AI在执法中的伦理问题")
            print("   隐私保护与公共安全的平衡")
            print("   算法透明度和问责制")
    
    return all_results

def main():
    print("🚨 罪行AI信息搜索")
    print("=" * 50)
    
    # 尝试在线搜索
    success = search_google_alternative("AI crime detection")
    
    if not success:
        print("\n⚠️  在线搜索受限，提供已知罪行AI信息:")
        print("=" * 50)
        get_crime_ai_info()
    
    print("\n" + "=" * 50)
    print("💡 最有价值的5条罪行AI信息:")
    print("=" * 50)
    
    valuable_info = [
        {
            "title": "预测性警务算法",
            "description": "使用机器学习预测犯罪热点区域，基于历史犯罪数据和环境因素",
            "应用": "芝加哥、洛杉矶等城市警方使用",
            "争议": "存在算法偏见，可能针对特定社区"
        },
        {
            "title": "面部识别技术",
            "description": "AI面部识别用于追踪犯罪嫌疑人，准确率超过99%",
            "应用": "中国公安部门广泛部署",
            "争议": "隐私侵犯和误识别问题"
        },
        {
            "title": "社交媒体监控",
            "description": "分析社交媒体数据识别潜在犯罪威胁和极端主义内容",
            "应用": "FBI和国土安全部使用",
            "争议": "言论自由和隐私权问题"
        },
        {
            "title": "犯罪风险评估算法",
            "description": "评估个人犯罪风险，用于保释和量刑决策",
            "应用": "美国多个州法院使用COMPAS系统",
            "争议": "种族偏见和缺乏透明度"
        },
        {
            "title": "智能监控系统",
            "description": "AI视频分析实时检测异常行为和可疑活动",
            "应用": "智慧城市建设，公共安全监控",
            "争议": "大规模监控和个人自由"
        }
    ]
    
    for i, info in enumerate(valuable_info, 1):
        print(f"{i}. {info['title']}")
        print(f"   描述: {info['description']}")
        print(f"   应用: {info['应用']}")
        print(f"   争议: {info['争议']}")
        print()

if __name__ == "__main__":
    main()