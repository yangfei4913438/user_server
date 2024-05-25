## 系统设计

一个相对完善的用户管理系统。包含了消息队列、缓存、数据库、jwt 等内容，

### 功能设计目标：

#### 权限管理
- 权限创建：提供一个RESTFUL API，允许管理员通过POST请求创建新的权限角色。例如：POST /api/v1/permissions，请求体中包含角色名称和权限列表。
- 权限查询：提供GET请求的API来查询权限，如：GET /api/v1/permissions，返回所有角色的权限信息。
- 权限修改：通过PUT或PATCH请求更新权限，如：PUT /api/v1/permissions/{roleId}，请求体中包含更新的权限列表。
- 权限删除：提供DELETE请求的API来删除权限，如：DELETE /api/v1/permissions/{roleId}。
- 审计功能：每次用户操作后，自动记录操作详情到审计日志表，包括操作者ID、操作类型、操作结果和时间戳。


#### 用户管理
- 用户注册：提供多种注册API，如：POST /api/v1/users，支持手机号、邮箱和用户名密码注册。
  - 用户信息：用户名 ID（自动生成 uuid）, 用户名，昵称，手机号，邮箱，密码，权限, 出生日期（年月日），家乡（省、市、区），所在地（省、市、区）, 创建时间，更新时间
- 用户认证：提供登录API，如：POST /api/v1/auth/login，根据用户提供的认证信息生成JWT。
  - jwt: 7 天有效，一个用户只能登录 1 个设备，token 有效期 7 天。
  - 认证方式: 手机号+验证码或密码, 邮箱+验证码或密码, 用户名+密码
- 用户列表获取：提供API获取用户列表，如：GET /api/v1/users。
- 用户资料更新：提供API更新用户资料，如：PUT /api/v1/users/{userId}。
- 用户注销：提供注销API，如：POST /api/v1/users/{userId}/deactivate，设置注销状态并开始30天冷静期。
  - 冷静期: 30 天内用户可以继续登录，登录自动解除注销操作。30 天内未登录，执行真实删除。
- 邮件通知：使用RabbitMQ发送邮件通知，如注册成功、资料变更等。
  - 通知类型: 注册成功，资料变更，冷静期提示，账号删除通知。


### 技术栈
- Node.js with TypeScript：使用TypeScript编写Node.js应用，利用其静态类型检查提高代码质量。
- NestJS：利用NestJS的模块化、依赖注入和中间件功能，构建结构清晰的应用。
- MySQL：使用MySQL存储数据
- RabbitMQ：配置RabbitMQ用于处理邮件发送、审计日志记录等异步任务。
- Prisma：通过Prisma Migrate管理数据库迁移，确保开发和生产环境的一致性。
- Redis：配置Redis缓存用户信息和权限等数据，设置合适的缓存策略和过期时间。
- JWT：使用JWT进行用户认证，确保每个请求都携带有效的JWT（注册、登录接口除外）

### 安全性考虑
- 数据加密：使用 argon2 等算法对用户密码进行哈希存储。argon2的安全系数相比于常见的哈希算法，要高出很多。Argon2有三个变种：Argon2i, Argon2d, and Argon2id：
  - Argon2d是比较快的，被用于数据依赖的内存访问，这使得它对GPU破解攻击具有很高的抵抗力，适用于不受侧信道攻击威胁的应用程序（如加密货币）
  - Argon2i使用独立于数据的内存访问，这是密码散列和基于密码的密钥派生的首选方法，但速度较慢，因为它会在内存中进行更多的传递，以防止受到折衷攻击。
  - Argon2id是Argon2i和Argon2d的混合体，使用依赖于数据和独立于数据的内存访问的组合，这使Argon2i能够抵抗侧通道缓存计时攻击，并使Argon2d能够抵抗GPU破解攻击。
- 访问控制：使用NestJS的Guard功能实现基于角色的访问控制。
- 审计日志: 记录所有的增删改操作, 方便追溯操作记录。
