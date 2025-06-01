from flask import Blueprint, request, current_app
import requests
from bs4 import BeautifulSoup
import traceback
from datetime import datetime, timedelta
import json
import time
import random
import akshare as ak

import app.utils as utils

# 创建新闻蓝图
news_controller = Blueprint("news_controller", __name__)

# 缓存数据，减少重复请求
news_cache = {
    "market_news": {"data": [], "timestamp": None},
    "topic_news": {"data": [], "timestamp": None},
}

# 缓存有效期（秒）
CACHE_EXPIRY = 300  # 5分钟


@news_controller.route("/market", methods=["GET"])
def get_market_news():
    """
    获取市场资讯（财新网）
    请求参数:
        - limit: 获取新闻条数，默认20条
    """
    try:
        # 获取请求参数
        limit = int(request.args.get('limit', 20))
        
        current_app.logger.info(f"获取市场资讯: limit={limit}")
        
        try:
            # 使用财新网接口获取新闻数据
            current_app.logger.info("开始获取财新网市场资讯")
            news_df = ak.stock_news_main_cx()
            
            if news_df.empty:
                current_app.logger.warning("财新网接口返回空数据")
                return utils.success(data=[], message='暂无市场资讯')
            
            current_app.logger.info(f"获取到财新网新闻数据，共 {len(news_df)} 条记录")
            
            # 限制返回条数
            limited_news = news_df.head(limit)
            
            # 转换为字典列表，并格式化字段
            news_list = []
            for _, row in limited_news.iterrows():
                try:
                    news_item = {
                        'title': str(row.get('tag', '')),  # 使用tag作为标题
                        'summary': str(row.get('summary', '')),  # 摘要
                        'link': str(row.get('url', '')),  # 链接
                        'publish_time': str(row.get('pub_time', '')),  # 发布时间
                        'interval_time': str(row.get('interval_time', '')),  # 间隔时间
                        'source': '财新网'  # 添加来源标识
                    }
                    
                    # 只添加有标题的新闻
                    if news_item['title'].strip():
                        news_list.append(news_item)
                        
                except Exception as item_error:
                    current_app.logger.warning(f"处理新闻条目出错: {str(item_error)}")
                    continue
            
            current_app.logger.info(f"成功处理 {len(news_list)} 条市场资讯")
            
            return utils.success(
                data=news_list,
                message='获取市场资讯成功'
            )
            
        except Exception as news_error:
            current_app.logger.error(f"获取财新网资讯失败: {str(news_error)}")
            current_app.logger.error(traceback.format_exc())
            
            # 返回备用数据
            fallback_news = [
                {
                    'title': '市场收盘综述',
                    'summary': '今日A股三大指数涨跌不一，个股表现分化',
                    'link': 'https://cxdata.caixin.com/pc/',
                    'publish_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'interval_time': '刚刚',
                    'source': '财新网'
                },
                {
                    'title': '机构观点',
                    'summary': '多家券商发布最新投资策略报告',
                    'link': 'https://cxdata.caixin.com/pc/',
                    'publish_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'interval_time': '1小时前',
                    'source': '财新网'
                },
                {
                    'title': '行业动态',
                    'summary': '新能源汽车板块表现活跃，多只个股涨停',
                    'link': 'https://cxdata.caixin.com/pc/',
                    'publish_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'interval_time': '2小时前',
                    'source': '财新网'
                }
            ]
            
            current_app.logger.info("使用备用市场资讯数据")
            
            return utils.success(
                data=fallback_news,
                message='获取市场资讯成功（备用数据）'
            )
            
    except Exception as e:
        current_app.logger.error(f"获取市场资讯失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'获取市场资讯失败: {str(e)}', code=500, status=500)


@news_controller.route("/topic", methods=["GET"])
def get_topic_news():
    """获取主题新闻"""
    try:
        topic = request.args.get("topic", "")
        if not topic:
            return utils.error(message="主题不能为空", code=400)

        # 检查缓存是否有效
        cache_key = f"topic_news_{topic}"
        if (
            cache_key in news_cache
            and news_cache[cache_key]["timestamp"] is not None
            and (datetime.now() - news_cache[cache_key]["timestamp"]).total_seconds()
            < CACHE_EXPIRY
        ):
            current_app.logger.info(f"使用缓存的主题新闻数据: {topic}")
            return utils.success(data=news_cache[cache_key]["data"])

        current_app.logger.info(f"获取主题新闻: {topic}")

        # 获取新闻数量限制
        limit = min(int(request.args.get("limit", 5)), 10)

        # 构建搜索URL
        search_url = (
            f"https://search.sina.com.cn/news/search?q={topic}&c=news&sort=time"
        )
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

        try:
            response = requests.get(search_url, headers=headers, timeout=5)
            response.encoding = "utf-8"

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")
                news_items = soup.select(".box-result")

                topic_news = []
                for i, item in enumerate(news_items):
                    if i >= limit:
                        break

                    title_element = item.select_one("h2 a")
                    if title_element:
                        title = title_element.get_text().strip()
                        link = title_element.get("href", "")

                        # 获取摘要
                        summary_element = item.select_one(".content")
                        summary = (
                            summary_element.get_text().strip()
                            if summary_element
                            else ""
                        )

                        # 获取来源和发布时间
                        source = "Unknown"
                        publish_time = "Unknown"
                        info_element = item.select_one(".fgray_time")
                        if info_element:
                            info_text = info_element.get_text().strip()
                            if "来源：" in info_text:
                                source = info_text.split("来源：")[1].split()[0]
                            publish_time = info_text.split("  ")[0]

                        topic_news.append(
                            {
                                "title": title,
                                "summary": summary,
                                "link": link,
                                "source": source,
                                "publish_time": publish_time,
                            }
                        )
            else:
                # 如果请求失败，使用备用数据
                current_app.logger.warning(
                    f"获取主题新闻失败，状态码: {response.status_code}"
                )
                topic_news = generate_fallback_topic_news(topic, limit)

        except Exception as e:
            current_app.logger.error(f"抓取主题新闻失败: {str(e)}")
            topic_news = generate_fallback_topic_news(topic, limit)

        # 更新缓存
        news_cache[cache_key] = {"data": topic_news, "timestamp": datetime.now()}

        return utils.success(data=topic_news)
    except Exception as e:
        current_app.logger.error(f"获取主题新闻失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f"获取主题新闻失败: {str(e)}", code=500)


def generate_fallback_news(limit):
    """生成备用新闻数据"""
    current_app.logger.info("使用备用新闻数据")

    fallback_news = [
        {
            "title": "央行宣布降低存款准备金率0.5个百分点，释放长期资金",
            "link": "https://example.com/news/1",
            "source": "财经网",
            "publish_time": (datetime.now() - timedelta(hours=2)).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
        },
        {
            "title": "国务院常务会议：加大力度支持实体经济发展",
            "link": "https://example.com/news/2",
            "source": "人民网",
            "publish_time": (datetime.now() - timedelta(hours=3)).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
        },
        {
            "title": "证监会：严厉打击证券市场违法行为，维护投资者权益",
            "link": "https://example.com/news/3",
            "source": "证券时报",
            "publish_time": (datetime.now() - timedelta(hours=5)).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
        },
        {
            "title": "两市成交额连续三日突破万亿，北向资金净流入超50亿",
            "link": "https://example.com/news/4",
            "source": "上海证券报",
            "publish_time": (datetime.now() - timedelta(hours=6)).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
        },
        {
            "title": "国家统计局：上半年GDP同比增长5.5%，经济稳中向好",
            "link": "https://example.com/news/5",
            "source": "经济日报",
            "publish_time": (datetime.now() - timedelta(hours=7)).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
        },
        {
            "title": "发改委：加快推进新型基础设施建设，释放数字经济潜力",
            "link": "https://example.com/news/6",
            "source": "中国经济网",
            "publish_time": (datetime.now() - timedelta(hours=9)).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
        },
        {
            "title": "银保监会：防范金融风险，促进银行保险业高质量发展",
            "link": "https://example.com/news/7",
            "source": "金融时报",
            "publish_time": (datetime.now() - timedelta(hours=10)).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
        },
        {
            "title": "财政部：前5个月全国一般公共预算收入增长8.9%",
            "link": "https://example.com/news/8",
            "source": "新华社",
            "publish_time": (datetime.now() - timedelta(hours=12)).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
        },
        {
            "title": "科创板迎来百家上市公司，总市值突破2万亿",
            "link": "https://example.com/news/9",
            "source": "上交所",
            "publish_time": (datetime.now() - timedelta(hours=24)).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
        },
        {
            "title": "中央经济工作会议：明年继续实施积极的财政政策和稳健的货币政策",
            "link": "https://example.com/news/10",
            "source": "中国政府网",
            "publish_time": (datetime.now() - timedelta(hours=36)).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
        },
    ]

    random.shuffle(fallback_news)
    return fallback_news[:limit]


def generate_fallback_topic_news(topic, limit):
    """生成备用主题新闻数据"""
    current_app.logger.info(f"使用备用主题新闻数据: {topic}")

    topics = {
        "科技": [
            {
                "title": f"{topic}领域迎来重大突破，AI模型训练速度提升10倍",
                "summary": "研究人员开发了新型算法，大幅提升了AI模型训练效率，为行业带来革命性变化。",
                "link": "https://example.com/tech/1",
                "source": "科技日报",
                "publish_time": (datetime.now() - timedelta(hours=5)).strftime(
                    "%Y-%m-%d"
                ),
            },
            {
                "title": f"国内{topic}企业融资额创新高，资本市场青睐创新",
                "summary": "今年以来，科技创新企业融资规模持续扩大，投资重点向人工智能、新能源等领域倾斜。",
                "link": "https://example.com/tech/2",
                "source": "创业邦",
                "publish_time": (datetime.now() - timedelta(hours=8)).strftime(
                    "%Y-%m-%d"
                ),
            },
        ],
        "金融": [
            {
                "title": f"{topic}监管新规出台，强化风险管理要求",
                "summary": "金融监管部门发布新规定，要求金融机构加强内控建设，防范系统性风险。",
                "link": "https://example.com/finance/1",
                "source": "金融时报",
                "publish_time": (datetime.now() - timedelta(hours=3)).strftime(
                    "%Y-%m-%d"
                ),
            },
            {
                "title": f"央行下调{topic}机构存款准备金率，释放长期流动性",
                "summary": "中国人民银行宣布，自下月起下调金融机构存款准备金率0.5个百分点，释放长期资金约1万亿元。",
                "link": "https://example.com/finance/2",
                "source": "央行网站",
                "publish_time": (datetime.now() - timedelta(hours=7)).strftime(
                    "%Y-%m-%d"
                ),
            },
        ],
        "医药": [
            {
                "title": f"国产{topic}研发取得突破，新药获批上市",
                "summary": "我国自主研发的创新药物通过审批，填补国内医药领域空白，为患者带来新的治疗选择。",
                "link": "https://example.com/pharma/1",
                "source": "医药经济报",
                "publish_time": (datetime.now() - timedelta(hours=4)).strftime(
                    "%Y-%m-%d"
                ),
            },
            {
                "title": f"{topic}行业整合加速，龙头企业市占率提升",
                "summary": "医药行业并购重组案例增多，行业集中度持续提高，头部企业优势明显。",
                "link": "https://example.com/pharma/2",
                "source": "健康时报",
                "publish_time": (datetime.now() - timedelta(hours=9)).strftime(
                    "%Y-%m-%d"
                ),
            },
        ],
    }

    # 如果找不到对应主题，生成通用新闻
    if topic not in topics:
        return [
            {
                "title": f"关于{topic}的最新研究报告发布",
                "summary": f"最新发布的{topic}行业研究报告显示，该领域正呈现良好的发展态势，未来市场空间广阔。",
                "link": "https://example.com/general/1",
                "source": "经济参考报",
                "publish_time": (
                    datetime.now() - timedelta(hours=random.randint(1, 12))
                ).strftime("%Y-%m-%d"),
            },
            {
                "title": f"{topic}领域政策利好，行业迎来发展机遇",
                "summary": f"国家相关部门出台支持{topic}行业发展的新政策，为企业带来新的发展机遇。",
                "link": "https://example.com/general/2",
                "source": "人民网",
                "publish_time": (
                    datetime.now() - timedelta(hours=random.randint(1, 12))
                ).strftime("%Y-%m-%d"),
            },
            {
                "title": f"{topic}创新成果亮相国际展会",
                "summary": f"我国{topic}领域的创新成果在国际展会上受到广泛关注，展示了强大的科技实力。",
                "link": "https://example.com/general/3",
                "source": "科技日报",
                "publish_time": (
                    datetime.now() - timedelta(hours=random.randint(1, 12))
                ).strftime("%Y-%m-%d"),
            },
        ][:limit]

    return topics[topic][:limit]
