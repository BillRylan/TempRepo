import com.sun.net.httpserver.HttpServer
import java.net.InetSocketAddress
import java.net.URLDecoder
import groovy.json.JsonBuilder
import java.text.SimpleDateFormat

// 日志格式化工具
def dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS")

// 打印日志方法（带时间戳和日志级别）
def log(String level, String message) {
    println "[${dateFormat.format(new Date())}] [${level}] ${message}"
}

// 容器信息解析逻辑
def parseContainerInfo(String doc) {
    // 提取Name和Namespace（实际场景中可替换为更健壮的解析逻辑）
    def nameMatcher = (doc =~ /(?m)^Name:\s+(\S+)/)
    def namespaceMatcher = (doc =~ /(?m)^Namespace:\s+(\S+)/)
    
    if (!nameMatcher.matches() || !namespaceMatcher.matches()) {
        throw new IllegalArgumentException("文档格式错误：缺少Name或Namespace字段")
    }
    
    def name = nameMatcher[0][1]
    def namespace = namespaceMatcher[0][1]
    
    // 模拟容器数据
    def containers = [
        [
            name: "vault-agent-init",
            id: "containerd://123",
            limits: [cpu: "500m", memory: "128Mi"],
            requests: [cpu: "250m", memory: "64Mi"]
        ]
    ]
    
    return [
        name: name,
        namespace: namespace,
        containers: containers
    ]
}

// 启动带日志的HTTP服务
def startServer(int port) {
    HttpServer server = HttpServer.create(new InetSocketAddress(port), 0)
    log("INFO", "服务器初始化中，绑定端口: ${port}")
    
    // 注册GET接口并添加详细日志
    server.createContext('/api/parse-containers') { exchange ->
        def startTime = System.currentTimeMillis() // 记录开始时间
        def clientAddress = exchange.remoteAddress.hostString // 客户端IP
        def requestMethod = exchange.requestMethod
        
        try {
            // 1. 打印请求基本信息
            log("INFO", "收到请求 - 客户端: ${clientAddress}, 方法: ${requestMethod}, 路径: ${exchange.requestURI.path}")
            
            // 2. 解析请求参数并日志
            def query = exchange.requestURI.query
            log("INFO", "请求参数: ${query ?: '无'}")
            
            // 3. 处理GET请求
            if (requestMethod == 'GET') {
                // 解析doc参数
                def docParam = query?.split('&')?.find { it.startsWith('doc=') }?.split('=')[1]
                def doc = docParam ? URLDecoder.decode(docParam, 'UTF-8') : ''
                log("INFO", "接收到的文档内容: ${doc.substring(0, Math.min(100, doc.length()))}...") // 日志截断长内容
                
                if (!doc) {
                    // 处理空参数
                    def errorMsg = new JsonBuilder([error: "缺少doc参数，请传入容器文档"]).toString()
                    exchange.sendResponseHeaders(400, errorMsg.bytes.length)
                    exchange.responseBody.withWriter { it.write(errorMsg) }
                    log("WARN", "请求处理完成 - 状态码: 400, 耗时: ${System.currentTimeMillis() - startTime}ms")
                    return
                }
                
                // 解析文档并返回结果
                def result = parseContainerInfo(doc)
                String jsonResponse = new JsonBuilder(result).toPrettyString()
                
                exchange.responseHeaders.set('Content-Type', 'application/json')
                exchange.responseHeaders.set('Access-Control-Allow-Origin', '*')
                exchange.sendResponseHeaders(200, jsonResponse.bytes.length)
                exchange.responseBody.withWriter { it.write(jsonResponse) }
                
                // 打印成功日志
                log("INFO", "请求处理完成 - 状态码: 200, 容器数量: ${result.containers.size()}, 耗时: ${System.currentTimeMillis() - startTime}ms")
            } else {
                // 处理不支持的方法
                exchange.sendResponseHeaders(405, -1)
                log("WARN", "请求处理完成 - 状态码: 405 (方法不支持), 耗时: ${System.currentTimeMillis() - startTime}ms")
            }
        } catch (IllegalArgumentException e) {
            // 业务逻辑错误（如文档格式错误）
            def errorMsg = new JsonBuilder([error: e.message]).toString()
            exchange.responseHeaders.set('Content-Type', 'application/json')
            exchange.sendResponseHeaders(400, errorMsg.bytes.length)
            exchange.responseBody.withWriter { it.write(errorMsg) }
            log("ERROR", "业务错误: ${e.message}, 状态码: 400, 耗时: ${System.currentTimeMillis() - startTime}ms")
        } catch (Exception e) {
            // 其他异常
            def errorMsg = new JsonBuilder([error: "服务器内部错误: ${e.message}"]).toString()
            exchange.responseHeaders.set('Content-Type', 'application/json')
            exchange.sendResponseHeaders(500, errorMsg.bytes.length)
            exchange.responseBody.withWriter { it.write(errorMsg) }
            log("ERROR", "服务器异常: ${e.message}, 堆栈: ${e.stackTrace[0..2].join(', ')}，耗时: ${System.currentTimeMillis() - startTime}ms")
        } finally {
            exchange.close()
        }
    }
    
    server.start()
    log("INFO", "服务器启动成功，监听地址: http://localhost:${port}/api/parse-containers")
}

// 启动服务（端口8080）
startServer(8080)
