   create database jrrg_framework_db;
   use jrrg_framework_db;
   create table user
   (
       id       int auto_increment
           primary key,
       username varchar(255) not null,
       password varchar(60)  not null,
       nickname varchar(255) null,
       email    varchar(255) null,
       phone    varchar(11)  null,
       constraint user_pk
           unique (username)
   );
INSERT INTO jrrg_framework_db.user (id, username, password, nickname, email, phone) VALUES (1, 'admin', '$2b$12$D7zuwWk.oxlqiloFuGszduy3SFgf7kNIW/cT0UExCHITxeM4grJbK', 'tom', 'tom@example.com', '16666666666');
