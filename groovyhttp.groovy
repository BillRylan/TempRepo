import com.sun.net.httpserver.HttpServer
import java.net.InetSocketAddress
import groovy.json.JsonBuilder

// 启动HTTP服务，提供无参数GET接口
def startServer() {
    // 在8080端口启动服务
    HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0)
    
    // 注册GET接口，不处理任何参数
    server.createContext('/container/info') { exchange ->
        try {
            // 预设容器信息（实际场景可从本地获取）
            def containerInfo = [
                id: "container-12345",
                name: "web-app",
                status: "running",
                cpuUsage: "0.25",
                memoryUsage: "384Mi",
                image: "nginx:latest",
                namespace: "default"
            ]

            // 构建JSON响应
            def json = new JsonBuilder(containerInfo).toPrettyString()
            exchange.responseHeaders.set('Content-Type', 'application/json')
            exchange.sendResponseHeaders(200, json.bytes.length)
            exchange.responseBody.withWriter { it.write(json) }
        } catch (Exception e) {
            def error = new JsonBuilder([error: "服务器错误: ${e.message}"]).toString()
            exchange.sendResponseHeaders(500, error.bytes.length)
            exchange.responseBody.withWriter { it.write(error) }
        } finally {
            exchange.close()
        }
    }

    server.start()
    println "服务已启动，访问: http://localhost:8080/container/info"
}

// 启动服务
startServer()
