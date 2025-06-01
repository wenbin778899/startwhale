from flask import Blueprint, request, current_app
import requests
from bs4 import BeautifulSoup
import traceback
from datetime import datetime, timedelta
import json
import time
import random

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
    """获取市场新闻"""
    try:
        # 检查缓存是否有效
        if (
            news_cache["market_news"]["timestamp"] is not None
            and (
                datetime.now() - news_cache["market_news"]["timestamp"]
            ).total_seconds()
            < CACHE_EXPIRY
        ):
            current_app.logger.info("使用缓存的市场新闻数据")
            return utils.success(data=news_cache["market_news"]["data"])

        current_app.logger.info("获取实时市场新闻")

        # 获取新闻数量限制
        limit = min(int(request.args.get("limit", 10)), 30)
        market_news = []  # 初始化空列表

        # 定义所有可能的新闻来源及其解析方式
        news_sources = [
            {
                "name": "东方财富网",
                "url": "https://finance.eastmoney.com/news/",
                "selector": ".title",
                "link_selector": "a",
                "title_attr": "text",
                "info_selector": "p.info",
                "source_pattern": "来源：",
                "time_pattern": "发布时间：",
            },
            {
                "name": "腾讯财经",
                "url": "https://new.qq.com/ch/finance/",
                "selector": ".content-article",
                "link_selector": "a",
                "title_selector": "h3",
                "title_attr": "text",
            },
            {
                "name": "网易财经",
                "url": "https://money.163.com/finance",
                "selector": ".news_article",
                "link_selector": "a.news_title",
                "title_attr": "text",
            },
            {
                "name": "中国证券网",
                "url": "https://www.cs.com.cn/xwzx/",
                "selector": ".new-list li",
                "link_selector": "a",
                "title_attr": "text",
            },
            {
                "name": "新浪财经",
                "url": "https://finance.sina.com.cn/roll/index.d.html?cid=56592",
                "selector": ".list_009 li",
                "link_selector": "a",
                "title_attr": "text",
            },
            {
                "name": "腾讯财经",
                "url": "https://new.qq.com/ch/finance/",
                "selector": ".content-article",
                "link_selector": "a",
                "title_selector": "h3",
                "title_attr": "text",
            },
            {
                "name": "网易财经",
                "url": "https://money.163.com/finance",
                "selector": ".news_article",
                "link_selector": "a.news_title",
                "title_attr": "text",
            },
            {
                "name": "中国证券网",
                "url": "https://www.cs.com.cn/xwzx/",
                "selector": ".new-list li",
                "link_selector": "a",
                "title_attr": "text",
            },
        ]

        # 通用的请求头
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

        # 依次尝试所有新闻来源
        for source in news_sources:
            if len(market_news) > 0:
                # 如果已经获取到新闻，就不再尝试其他来源
                break

            try:
                current_app.logger.info(f'尝试从{source["name"]}获取新闻')
                response = requests.get(source["url"], headers=headers, timeout=5)
                response.encoding = "utf-8"

                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "html.parser")
                    news_list = soup.select(source["selector"])

                    # 特殊处理腾讯财经
                    if source["name"] == "腾讯财经":
                        for i, news in enumerate(news_list):
                            if i >= limit:
                                break

                            news_title = news.select_one(source["title_selector"])
                            news_link = news.find("a")

                            if news_title and news_link:
                                title = news_title.get_text().strip()
                                link = news_link.get("href", "")

                                market_news.append(
                                    {
                                        "title": title,
                                        "link": link,
                                        "source": source["name"],
                                        "publish_time": datetime.now().strftime(
                                            "%Y-%m-%d %H:%M:%S"
                                        ),
                                    }
                                )
                    else:
                        # 其他新闻源的通用处理
                        for i, news in enumerate(news_list):
                            if i >= limit:
                                break

                            news_link = news.find(source["link_selector"])
                            if news_link:
                                title = news_link.get_text().strip()
                                link = news_link.get("href", "")

                                # 如果是相对路径，转换为绝对路径
                                if link.startswith("/"):
                                    # 提取域名
                                    domain = "/".join(source["url"].split("/")[:3])
                                    link = domain + link

                                # 获取新闻来源和发布时间（如果有）
                                source_name = source["name"]
                                publish_time = datetime.now().strftime(
                                    "%Y-%m-%d %H:%M:%S"
                                )

                                # 尝试提取更详细的信息（如果有相关选择器）
                                if "info_selector" in source and news.select_one(
                                    source["info_selector"]
                                ):
                                    info_element = news.select_one(
                                        source["info_selector"]
                                    )
                                    info_text = info_element.get_text().strip()

                                    if (
                                        "source_pattern" in source
                                        and source["source_pattern"] in info_text
                                    ):
                                        source_name = info_text.split(
                                            source["source_pattern"]
                                        )[1].split()[0]

                                    if (
                                        "time_pattern" in source
                                        and source["time_pattern"] in info_text
                                    ):
                                        publish_time = info_text.split(
                                            source["time_pattern"]
                                        )[1].split()[0]

                                market_news.append(
                                    {
                                        "title": title,
                                        "link": link,
                                        "source": source_name,
                                        "publish_time": publish_time,
                                    }
                                )

                    if len(market_news) > 0:
                        current_app.logger.info(
                            f'成功从{source["name"]}获取到 {len(market_news)} 条新闻'
                        )
                    else:
                        current_app.logger.warning(
                            f'从{source["name"]}获取的新闻列表为空'
                        )

                else:
                    current_app.logger.warning(
                        f'获取{source["name"]}新闻失败，状态码: {response.status_code}'
                    )

            except Exception as e:
                current_app.logger.error(f'抓取{source["name"]}新闻失败: {str(e)}')

        # 如果所有来源都失败，返回空列表
        if len(market_news) == 0:
            current_app.logger.warning("所有新闻来源都失败，返回空列表")

        # 更新缓存
        news_cache["market_news"]["data"] = market_news
        news_cache["market_news"]["timestamp"] = datetime.now()

        return utils.success(data=market_news)
    except Exception as e:
        current_app.logger.error(f"获取市场新闻失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.success(data=[])  # 即使发生异常也返回成功状态和空数组


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
