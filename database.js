// ==============================================
// 📦 BANCO DE DADOS – Pecuária Pro WhatsApp Bot
// SQLite + Better-SQLite3
// ==============================================

import Database from "better-sqlite3";

// cria banco local
const db = new Database("./database.sqlite");


// ==============================================
// 1️⃣ CRIAÇÃO DE TABELAS
// ==============================================

// Tabela: USERS (memória por usuário)
db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE,
    name TEXT,
    last_message TEXT,
    last_interaction TEXT,
    data TEXT
);
`);

// Tabela: CONVERSATIONS (histórico do chat)
db.exec(`
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT,
    role TEXT,
    message TEXT,
    timestamp TEXT,
    FOREIGN KEY(phone) REFERENCES users(phone)
);
`);

// Tabela: DIAGNOSTICS (dados estruturados enviados pelo usuário)
db.exec(`
CREATE TABLE IF NOT EXISTS diagnostics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT,
    category TEXT,
    data TEXT,
    created_at TEXT,
    FOREIGN KEY(phone) REFERENCES users(phone)
);
`);
// === TABELA ANIMALS ===
db.exec(`
CREATE TABLE IF NOT EXISTS animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_phone TEXT,
    name TEXT,
    breed TEXT,
    weight REAL,
    age INTEGER,
    notes TEXT,
    created_at TEXT
);
`);

// =============================================
// FUNÇÕES — ANIMALS (CRUD)
// =============================================

// Criar novo animal
export function createAnimal(owner_phone, name, breed, weight, age, notes) {
    return db.prepare(`
        INSERT INTO animals (owner_phone, name, breed, weight, age, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(owner_phone, name, breed, weight, age, notes);
}

// Listar todos os animais do usuário
export function getAnimalsByUser(owner_phone) {
    return db.prepare(`
        SELECT * FROM animals WHERE owner_phone = ?
    `).all(owner_phone);
}

// Buscar animal específico pelo ID
export function getAnimalById(id) {
    return db.prepare(`
        SELECT * FROM animals WHERE id = ?
    `).get(id);
}

// Atualizar dados do animal
export function updateAnimal(id, name, breed, weight, age, notes) {
    return db.prepare(`
        UPDATE animals
        SET name = ?, breed = ?, weight = ?, age = ?, notes = ?
        WHERE id = ?
    `).run(name, breed, weight, age, notes, id);
}

// Deletar animal
export function deleteAnimal(id) {
    return db.prepare(`
        DELETE FROM animals WHERE id = ?
    `).run(id);
}


// ==============================================
// 2️⃣ FUNÇÕES USERS
// ==============================================

// Buscar usuário pelo telefone
export function getUser(phone) {
    return db.prepare("SELECT * FROM users WHERE phone=?").get(phone);
}

// Criar novo usuário
export function createUser(phone, name = null) {
    db.prepare(`
        INSERT INTO users (phone, name, last_interaction, data)
        VALUES (?, ?, DATETIME('now'), '{}')
    `).run(phone, name);
}

// Atualizar dados do usuário
export function updateUser(phone, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys.map(k => `${k}=?`).join(", ");

    db.prepare(`
        UPDATE users SET ${setClause} WHERE phone=?
    `).run(...values, phone);
}


// ==============================================
// 3️⃣ FUNÇÕES DE CONVERSAÇÃO / CONTEXTO
// ==============================================

// Salvar uma mensagem no histórico
export function addConversation(phone, role, message) {
    db.prepare(`
        INSERT INTO conversations (phone, role, message, timestamp)
        VALUES (?, ?, ?, DATETIME('now'))
    `).run(phone, role, message);
}

// Recuperar histórico limitado (ex.: últimas 10 mensagens)
export function getConversationHistory(phone, limit = 10) {
    return db.prepare(`
        SELECT role, message FROM conversations
        WHERE phone=?
        ORDER BY id DESC
        LIMIT ?
    `).all(phone, limit).reverse();
}

// Limpar histórico (opcional)
export function clearConversation(phone) {
    db.prepare("DELETE FROM conversations WHERE phone=?").run(phone);
}


// ==============================================
// 4️⃣ FUNÇÕES DIAGNÓSTICOS (dados estruturados)
// ==============================================

// Salvar diagnóstico
export function saveDiagnostic(phone, category, data) {
    db.prepare(`
        INSERT INTO diagnostics (phone, category, data, created_at)
        VALUES (?, ?, ?, DATETIME('now'))
    `).run(phone, category, JSON.stringify(data));
}

// Buscar diagnósticos do usuário
export function getDiagnostics(phone) {
    return db.prepare(`
        SELECT * FROM diagnostics WHERE phone=? ORDER BY id DESC
    `).all(phone);
}


// ==============================================
// 5️⃣ EXPORTA DB (opcional p/ debug)
// ==============================================
export default db;
