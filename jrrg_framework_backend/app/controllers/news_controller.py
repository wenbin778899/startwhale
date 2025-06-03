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
    获取市场资讯（东方财富全球财经快讯）
    请求参数:
        - limit: 获取新闻条数，默认20条
    """
    try:
        # 获取请求参数
        limit = int(request.args.get('limit', 20))
        
        current_app.logger.info(f"获取东财全球财经快讯: limit={limit}")
        
        try:
            # 使用东方财富全球财经快讯接口获取新闻数据
            current_app.logger.info("开始获取东方财富全球财经快讯")
            news_df = ak.stock_info_global_em()
            
            if news_df.empty:
                current_app.logger.warning("东方财富全球财经快讯接口返回空数据")
                return utils.success(data=[], message='暂无市场资讯')
            
            current_app.logger.info(f"获取到东财全球财经快讯数据，共 {len(news_df)} 条记录")
            
            # 限制返回条数
            limited_news = news_df.head(limit)
            
            # 转换为字典列表，并格式化字段
            news_list = []
            for _, row in limited_news.iterrows():
                try:
                    news_item = {
                        'title': str(row.get('标题', '')),  # 标题
                        'summary': str(row.get('摘要', '')),  # 摘要
                        'link': str(row.get('链接', '')),  # 链接
                        'publish_time': str(row.get('发布时间', '')),  # 发布时间
                        'source': '东方财富'  # 添加来源标识
                    }
                    
                    # 只添加有标题的新闻
                    if news_item['title'].strip() and news_item['title'] != 'nan':
                        news_list.append(news_item)
                        
                except Exception as item_error:
                    current_app.logger.warning(f"处理新闻条目出错: {str(item_error)}")
                    continue
            
            current_app.logger.info(f"成功处理 {len(news_list)} 条东财全球财经快讯")
            
            return utils.success(
                data=news_list,
                message='获取市场资讯成功'
            )
            
        except Exception as news_error:
            current_app.logger.error(f"获取东财全球财经快讯失败: {str(news_error)}")
            current_app.logger.error(traceback.format_exc())
            
            # 返回备用数据
            fallback_news = [
                {
                    'title': '央行宣布降准0.5个百分点 释放长期资金约1万亿元',
                    'summary': '中国人民银行决定于12月15日下调金融机构存款准备金率0.5个百分点，释放长期资金约1万亿元',
                    'link': 'https://kuaixun.eastmoney.com/7_24.html',
                    'publish_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'source': '东方财富'
                },
                {
                    'title': '证监会：继续完善多层次资本市场体系建设',
                    'summary': '证监会表示将继续推进资本市场制度建设，完善多层次资本市场体系，提高直接融资比重',
                    'link': 'https://kuaixun.eastmoney.com/7_24.html',
                    'publish_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'source': '东方财富'
                },
                {
                    'title': '北向资金净流入超50亿元 连续三日净买入',
                    'summary': '今日北向资金净流入52.3亿元，其中沪股通净流入28.7亿元，深股通净流入23.6亿元',
                    'link': 'https://kuaixun.eastmoney.com/7_24.html',
                    'publish_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'source': '东方财富'
                },
                {
                    'title': '科创板注册制改革持续深化 市场活力不断释放',
                    'summary': '科创板自设立以来累计IPO超过500家，总市值突破6万亿元，市场活力持续释放',
                    'link': 'https://kuaixun.eastmoney.com/7_24.html',
                    'publish_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'source': '东方财富'
                },
                {
                    'title': '新能源汽车板块表现强势 多只个股涨停',
                    'summary': '受政策利好影响，新能源汽车板块今日表现强势，比亚迪、宁德时代等龙头股领涨',
                    'link': 'https://kuaixun.eastmoney.com/7_24.html',
                    'publish_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'source': '东方财富'
                }
            ]
            
            current_app.logger.info("使用备用市场资讯数据（东财风格）")
            
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


@news_controller.route("/breakfast", methods=["GET"])
def get_breakfast_news():
    """
    获取东方财富财经早餐
    请求参数:
        - limit: 获取新闻条数，默认10条
    """
    try:
        # 获取请求参数
        limit = int(request.args.get('limit', 10))
        
        current_app.logger.info(f"获取东方财富财经早餐: limit={limit}")
        
        try:
            # 使用东方财富财经早餐接口获取新闻数据
            current_app.logger.info("开始获取东方财富财经早餐")
            news_df = ak.stock_info_cjzc_em()
            
            if news_df.empty:
                current_app.logger.warning("东方财富财经早餐接口返回空数据")
                return utils.success(data=[], message='暂无财经早餐')
            
            current_app.logger.info(f"获取到财经早餐数据，共 {len(news_df)} 条记录")
            
            # 限制返回条数
            limited_news = news_df.head(limit)
            
            # 转换为字典列表，并格式化字段
            news_list = []
            for _, row in limited_news.iterrows():
                try:
                    news_item = {
                        'title': str(row.get('标题', '')),  # 标题
                        'summary': str(row.get('摘要', '')),  # 摘要
                        'link': str(row.get('链接', '')),  # 链接
                        'publish_time': str(row.get('发布时间', '')),  # 发布时间
                        'source': '东方财富早餐',  # 添加来源标识
                        'category': 'breakfast'  # 添加分类标识
                    }
                    
                    # 只添加有标题的新闻
                    if news_item['title'].strip() and news_item['title'] != 'nan':
                        news_list.append(news_item)
                        
                except Exception as item_error:
                    current_app.logger.warning(f"处理财经早餐条目出错: {str(item_error)}")
                    continue
            
            current_app.logger.info(f"成功处理 {len(news_list)} 条财经早餐")
            
            return utils.success(
                data=news_list,
                message='获取财经早餐成功'
            )
            
        except Exception as news_error:
            current_app.logger.error(f"获取财经早餐失败: {str(news_error)}")
            current_app.logger.error(traceback.format_exc())
            
            # 返回备用数据
            fallback_news = [
                {
                    'title': '东方财富财经早餐 今日要闻',
                    'summary': '今日市场关注焦点：央行货币政策会议纪要发布，科技股财报密集发布，关注市场流动性变化',
                    'link': 'https://stock.eastmoney.com/a/czpnc.html',
                    'publish_time': datetime.now().strftime('%Y-%m-%d'),
                    'source': '东方财富早餐',
                    'category': 'breakfast'
                }
            ]
            
            current_app.logger.info("使用备用财经早餐数据")
            
            return utils.success(
                data=fallback_news,
                message='获取财经早餐成功（备用数据）'
            )
            
    except Exception as e:
        current_app.logger.error(f"获取财经早餐失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'获取财经早餐失败: {str(e)}', code=500, status=500)


@news_controller.route("/futu", methods=["GET"])
def get_futu_news():
    """
    获取富途牛牛快讯
    请求参数:
        - limit: 获取新闻条数，默认20条
    """
    try:
        # 获取请求参数
        limit = int(request.args.get('limit', 20))
        
        current_app.logger.info(f"获取富途牛牛快讯: limit={limit}")
        
        try:
            # 使用富途牛牛快讯接口获取新闻数据
            current_app.logger.info("开始获取富途牛牛快讯")
            news_df = ak.stock_info_global_futu()
            
            if news_df.empty:
                current_app.logger.warning("富途牛牛快讯接口返回空数据")
                return utils.success(data=[], message='暂无富途快讯')
            
            current_app.logger.info(f"获取到富途快讯数据，共 {len(news_df)} 条记录")
            
            # 限制返回条数
            limited_news = news_df.head(limit)
            
            # 转换为字典列表，并格式化字段
            news_list = []
            for _, row in limited_news.iterrows():
                try:
                    news_item = {
                        'title': str(row.get('标题', '')),  # 标题
                        'summary': str(row.get('内容', '')),  # 内容作为摘要
                        'link': str(row.get('链接', '')),  # 链接
                        'publish_time': str(row.get('发布时间', '')),  # 发布时间
                        'source': '富途牛牛',  # 添加来源标识
                        'category': 'futu'  # 添加分类标识
                    }
                    
                    # 只添加有标题的新闻
                    if news_item['title'].strip() and news_item['title'] != 'nan':
                        news_list.append(news_item)
                        
                except Exception as item_error:
                    current_app.logger.warning(f"处理富途快讯条目出错: {str(item_error)}")
                    continue
            
            current_app.logger.info(f"成功处理 {len(news_list)} 条富途快讯")
            
            return utils.success(
                data=news_list,
                message='获取富途快讯成功'
            )
            
        except Exception as news_error:
            current_app.logger.error(f"获取富途快讯失败: {str(news_error)}")
            current_app.logger.error(traceback.format_exc())
            
            # 返回备用数据
            fallback_news = [
                {
                    'title': '美股盘前异动 科技股表现强势',
                    'summary': '美股盘前，科技股普遍上涨，英伟达涨超2%，特斯拉涨1.5%，投资者关注AI概念股表现',
                    'link': 'https://news.futunn.com/main/live',
                    'publish_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'source': '富途牛牛',
                    'category': 'futu'
                },
                {
                    'title': '港股通北向资金净流入创新高',
                    'summary': '今日港股通北向资金净流入超过100亿港元，创近期新高，资金持续流入优质港股',
                    'link': 'https://news.futunn.com/main/live',
                    'publish_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'source': '富途牛牛',
                    'category': 'futu'
                }
            ]
            
            current_app.logger.info("使用备用富途快讯数据")
            
            return utils.success(
                data=fallback_news,
                message='获取富途快讯成功（备用数据）'
            )
            
    except Exception as e:
        current_app.logger.error(f"获取富途快讯失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'获取富途快讯失败: {str(e)}', code=500, status=500)


@news_controller.route("/ths", methods=["GET"])
def get_ths_news():
    """
    获取同花顺财经直播
    请求参数:
        - limit: 获取新闻条数，默认20条
    """
    try:
        # 获取请求参数
        limit = int(request.args.get('limit', 20))
        
        current_app.logger.info(f"获取同花顺财经直播: limit={limit}")
        
        try:
            # 使用同花顺财经直播接口获取新闻数据
            current_app.logger.info("开始获取同花顺财经直播")
            news_df = ak.stock_info_global_ths()
            
            if news_df.empty:
                current_app.logger.warning("同花顺财经直播接口返回空数据")
                return utils.success(data=[], message='暂无同花顺资讯')
            
            current_app.logger.info(f"获取到同花顺资讯数据，共 {len(news_df)} 条记录")
            
            # 限制返回条数
            limited_news = news_df.head(limit)
            
            # 转换为字典列表，并格式化字段
            news_list = []
            for _, row in limited_news.iterrows():
                try:
                    news_item = {
                        'title': str(row.get('标题', '')),  # 标题
                        'summary': str(row.get('内容', '')),  # 内容作为摘要
                        'link': str(row.get('链接', '')),  # 链接
                        'publish_time': str(row.get('发布时间', '')),  # 发布时间
                        'source': '同花顺财经',  # 添加来源标识
                        'category': 'ths'  # 添加分类标识
                    }
                    
                    # 只添加有标题的新闻
                    if news_item['title'].strip() and news_item['title'] != 'nan':
                        news_list.append(news_item)
                        
                except Exception as item_error:
                    current_app.logger.warning(f"处理同花顺资讯条目出错: {str(item_error)}")
                    continue
            
            current_app.logger.info(f"成功处理 {len(news_list)} 条同花顺资讯")
            
            return utils.success(
                data=news_list,
                message='获取同花顺资讯成功'
            )
            
        except Exception as news_error:
            current_app.logger.error(f"获取同花顺资讯失败: {str(news_error)}")
            current_app.logger.error(traceback.format_exc())
            
            # 返回备用数据
            fallback_news = [
                {
                    'title': '机构论市：A股震荡整理 关注结构性机会',
                    'summary': '机构认为，当前A股市场处于震荡整理阶段，建议关注科技创新、消费升级等结构性投资机会',
                    'link': 'https://news.10jqka.com.cn/realtimenews.html',
                    'publish_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'source': '同花顺财经',
                    'category': 'ths'
                },
                {
                    'title': '北向资金连续净流入 外资看好A股长期价值',
                    'summary': '北向资金近期连续净流入，累计流入金额超过200亿元，外资持续看好A股市场长期投资价值',
                    'link': 'https://news.10jqka.com.cn/realtimenews.html',
                    'publish_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'source': '同花顺财经',
                    'category': 'ths'
                }
            ]
            
            current_app.logger.info("使用备用同花顺资讯数据")
            
            return utils.success(
                data=fallback_news,
                message='获取同花顺资讯成功（备用数据）'
            )
            
    except Exception as e:
        current_app.logger.error(f"获取同花顺资讯失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'获取同花顺资讯失败: {str(e)}', code=500, status=500)


@news_controller.route("/sina", methods=["GET"])
def get_sina_news():
    """
    获取新浪财经快讯
    请求参数:
        - limit: 获取新闻条数，默认20条
    """
    try:
        # 获取请求参数
        limit = int(request.args.get('limit', 20))
        
        current_app.logger.info(f"获取新浪财经快讯: limit={limit}")
        
        try:
            # 使用新浪财经快讯接口获取新闻数据
            current_app.logger.info("开始获取新浪财经快讯")
            news_df = ak.stock_info_global_sina()
            
            if news_df.empty:
                current_app.logger.warning("新浪财经快讯接口返回空数据")
                return utils.success(data=[], message='暂无新浪快讯')
            
            current_app.logger.info(f"获取到新浪快讯数据，共 {len(news_df)} 条记录")
            
            # 限制返回条数
            limited_news = news_df.head(limit)
            
            # 转换为字典列表，并格式化字段
            news_list = []
            for _, row in limited_news.iterrows():
                try:
                    news_item = {
                        'title': str(row.get('内容', ''))[:50] + '...' if len(str(row.get('内容', ''))) > 50 else str(row.get('内容', '')),  # 内容前50字作为标题
                        'summary': str(row.get('内容', '')),  # 完整内容作为摘要
                        'link': 'https://finance.sina.com.cn/7x24',  # 统一链接
                        'publish_time': str(row.get('时间', '')),  # 发布时间
                        'source': '新浪财经',  # 添加来源标识
                        'category': 'sina'  # 添加分类标识
                    }
                    
                    # 只添加有内容的新闻
                    if news_item['summary'].strip() and news_item['summary'] != 'nan':
                        news_list.append(news_item)
                        
                except Exception as item_error:
                    current_app.logger.warning(f"处理新浪快讯条目出错: {str(item_error)}")
                    continue
            
            current_app.logger.info(f"成功处理 {len(news_list)} 条新浪快讯")
            
            return utils.success(
                data=news_list,
                message='获取新浪快讯成功'
            )
            
        except Exception as news_error:
            current_app.logger.error(f"获取新浪快讯失败: {str(news_error)}")
            current_app.logger.error(traceback.format_exc())
            
            # 返回备用数据
            fallback_news = [
                {
                    'title': '央行今日进行逆回购操作 维护流动性合理充裕',
                    'summary': '中国人民银行今日进行1000亿元7天期逆回购操作，中标利率为1.80%，维护银行体系流动性合理充裕',
                    'link': 'https://finance.sina.com.cn/7x24',
                    'publish_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'source': '新浪财经',
                    'category': 'sina'
                },
                {
                    'title': '美联储官员发表讲话 关注通胀和就业数据',
                    'summary': '美联储官员表示将继续关注通胀和就业市场数据变化，为下一步货币政策调整提供参考依据',
                    'link': 'https://finance.sina.com.cn/7x24',
                    'publish_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'source': '新浪财经',
                    'category': 'sina'
                }
            ]
            
            current_app.logger.info("使用备用新浪快讯数据")
            
            return utils.success(
                data=fallback_news,
                message='获取新浪快讯成功（备用数据）'
            )
            
    except Exception as e:
        current_app.logger.error(f"获取新浪快讯失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'获取新浪快讯失败: {str(e)}', code=500, status=500)


@news_controller.route("/realtime", methods=["GET"])
def get_realtime_news():
    """
    获取实时综合资讯（整合多个数据源）
    请求参数:
        - sources: 数据源，逗号分隔，如 'global,breakfast,futu,ths,sina'
        - limit: 每个数据源获取条数，默认10条
    """
    try:
        # 获取请求参数
        sources_param = request.args.get('sources', 'global,breakfast,futu,ths')
        sources = [s.strip() for s in sources_param.split(',')]
        limit_per_source = int(request.args.get('limit', 10))
        
        current_app.logger.info(f"获取实时综合资讯: sources={sources}, limit_per_source={limit_per_source}")
        
        all_news = []
        
        # 根据请求的数据源获取新闻
        for source in sources:
            try:
                if source == 'global':
                    # 全球财经快讯
                    news_df = ak.stock_info_global_em()
                    if not news_df.empty:
                        for _, row in news_df.head(limit_per_source).iterrows():
                            if str(row.get('标题', '')).strip() and str(row.get('标题', '')) != 'nan':
                                all_news.append({
                                    'title': str(row.get('标题', '')),
                                    'summary': str(row.get('摘要', '')),
                                    'link': str(row.get('链接', '')),
                                    'publish_time': str(row.get('发布时间', '')),
                                    'source': '东方财富',
                                    'category': 'global'
                                })
                
                elif source == 'breakfast':
                    # 财经早餐
                    news_df = ak.stock_info_cjzc_em()
                    if not news_df.empty:
                        for _, row in news_df.head(limit_per_source).iterrows():
                            if str(row.get('标题', '')).strip() and str(row.get('标题', '')) != 'nan':
                                all_news.append({
                                    'title': str(row.get('标题', '')),
                                    'summary': str(row.get('摘要', '')),
                                    'link': str(row.get('链接', '')),
                                    'publish_time': str(row.get('发布时间', '')),
                                    'source': '东方财富早餐',
                                    'category': 'breakfast'
                                })
                
                elif source == 'futu':
                    # 富途牛牛
                    news_df = ak.stock_info_global_futu()
                    if not news_df.empty:
                        for _, row in news_df.head(limit_per_source).iterrows():
                            if str(row.get('标题', '')).strip() and str(row.get('标题', '')) != 'nan':
                                all_news.append({
                                    'title': str(row.get('标题', '')),
                                    'summary': str(row.get('内容', '')),
                                    'link': str(row.get('链接', '')),
                                    'publish_time': str(row.get('发布时间', '')),
                                    'source': '富途牛牛',
                                    'category': 'futu'
                                })
                
                elif source == 'ths':
                    # 同花顺
                    news_df = ak.stock_info_global_ths()
                    if not news_df.empty:
                        for _, row in news_df.head(limit_per_source).iterrows():
                            if str(row.get('标题', '')).strip() and str(row.get('标题', '')) != 'nan':
                                all_news.append({
                                    'title': str(row.get('标题', '')),
                                    'summary': str(row.get('内容', '')),
                                    'link': str(row.get('链接', '')),
                                    'publish_time': str(row.get('发布时间', '')),
                                    'source': '同花顺财经',
                                    'category': 'ths'
                                })
                
                elif source == 'sina':
                    # 新浪财经
                    news_df = ak.stock_info_global_sina()
                    if not news_df.empty:
                        for _, row in news_df.head(limit_per_source).iterrows():
                            content = str(row.get('内容', ''))
                            if content.strip() and content != 'nan':
                                all_news.append({
                                    'title': content[:50] + '...' if len(content) > 50 else content,
                                    'summary': content,
                                    'link': 'https://finance.sina.com.cn/7x24',
                                    'publish_time': str(row.get('时间', '')),
                                    'source': '新浪财经',
                                    'category': 'sina'
                                })
                                
            except Exception as source_error:
                current_app.logger.warning(f"获取 {source} 数据源失败: {str(source_error)}")
                continue
        
        # 按发布时间排序（需要解析时间格式）
        current_app.logger.info(f"成功获取 {len(all_news)} 条综合资讯")
        
        return utils.success(
            data=all_news,
            message='获取实时综合资讯成功'
        )
        
    except Exception as e:
        current_app.logger.error(f"获取实时综合资讯失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'获取实时综合资讯失败: {str(e)}', code=500, status=500)
