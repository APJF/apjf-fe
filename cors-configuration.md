# Cấu hình CORS cho Backend

Hiện tại ứng dụng frontend đang gặp lỗi CORS (Cross-Origin Resource Sharing) khi gọi API từ backend. Để sửa lỗi này trên backend, bạn cần cấu hình CORS như sau:

## Spring Boot (Java)

Thêm annotation `@CrossOrigin` hoặc cấu hình global CORS:

```java
// Cách 1: Thêm @CrossOrigin vào từng controller
@RestController
@RequestMapping("/api/exams")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class ExamController {
    // ...
}

// Cách 2: Cấu hình global trong WebConfig
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173", "http://localhost:5174")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

## Node.js (Express)

Sử dụng middleware cors:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Sử dụng CORS cho tất cả routes
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Hoặc cấu hình riêng cho từng route
app.get('/api/exams', cors(), (req, res) => {
  // ...
});
```

## ASP.NET Core

Cấu hình CORS trong Startup.cs:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend",
            builder =>
            {
                builder.WithOrigins("http://localhost:5173", "http://localhost:5174")
                       .AllowAnyMethod()
                       .AllowAnyHeader()
                       .AllowCredentials();
            });
    });
    
    // ...
}

public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    // ...
    app.UseCors("AllowFrontend");
    // ...
}
```

## Python (Flask)

Sử dụng Flask-CORS:

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://localhost:5174"]}})

@app.route('/api/exams')
def get_exams():
    # ...
```

## Python (Django)

Cấu hình trong settings.py:

```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
    # ...
]

MIDDLEWARE = [
    # ...
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ...
]

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
]

CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'OPTIONS',
]
```

Lưu ý: Trong môi trường production, bạn nên chỉ cho phép các origin cụ thể (không dùng "*") và cấu hình HTTPS thay vì HTTP.
