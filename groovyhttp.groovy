import com.sun.net.httpserver.HttpServer
import java.net.InetSocketAddress
import groovy.json.JsonBuilder

// 1. 定义容器信息解析逻辑（复用之前的核心功能）
def parseContainerInfo(String doc) {
    // 提取 Name 和 Namespace
    def name = (doc =~ /(?m)^Name:\s+(\S+)/)[0][1]
    def namespace = (doc =~ /(?m)^Namespace:\s+(\S+)/)[0][1]
    
    // 模拟容器数据（实际可替换为完整解析逻辑）
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

// 2. 创建并启动 HTTP 服务
def startServer(int port) {
    // 创建服务器，绑定到指定端口
    HttpServer server = HttpServer.create(new InetSocketAddress(port), 0)
    
    // 注册接口：处理 POST 请求
    server.createContext('/api/parse-containers') { exchange ->
        try {
            if (exchange.requestMethod == 'POST') {
                // 读取请求体（前端发送的文档内容）
                String requestBody = exchange.inputStream.withReader { it.text }
                
                // 解析容器信息
                def result = parseContainerInfo(requestBody)
                
                // 构建 JSON 响应
                String jsonResponse = new JsonBuilder(result).toPrettyString()
                
                // 设置响应头
                exchange.responseHeaders.set('Content-Type', 'application/json')
                exchange.responseHeaders.set('Access-Control-Allow-Origin', '*') // 允许跨域
                exchange.sendResponseHeaders(200, jsonResponse.bytes.length)
                
                // 发送响应内容
                exchange.responseBody.withWriter { writer ->
                    writer.write(jsonResponse)
                }
            } else {
                // 处理非 POST 请求（返回 405 方法不允许）
                exchange.sendResponseHeaders(405, -1)
            }
        } catch (Exception e) {
            // 错误处理
            String errorMsg = new JsonBuilder([error: e.message]).toString()
            exchange.responseHeaders.set('Content-Type', 'application/json')
            exchange.sendResponseHeaders(500, errorMsg.bytes.length)
            exchange.responseBody.withWriter { it.write(errorMsg) }
        } finally {
            exchange.close()
        }
    }
    
    // 启动服务器
    server.start()
    println "HTTP 服务已启动，端口: $port"
    println "接口地址: http://localhost:$port/api/parse-containers"
}

// 3. 启动服务（指定端口，如 8080）
startServer(8080)
