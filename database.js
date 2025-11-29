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

// Tabela: DIAGNOSTICS (dados estruturados)
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

// Tabela: ANIMALS (sistema antigo)
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

// ==============================================
// 🆕 TABELA NOVA: LOTES
// ==============================================
db.exec(`
CREATE TABLE IF NOT EXISTS lotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_number TEXT,
    numero_lote INTEGER,
    tipo TEXT,
    raca TEXT,
    peso TEXT,
    idade TEXT,
    sexo TEXT,
    quantidade INTEGER,
    observacao TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
`);


// ==============================================
// 2️⃣ FUNÇÕES — ANIMALS (CRUD)
// ==============================================

// Criar novo animal (sistema antigo – preservado)
export function createAnimal(owner_phone, name, breed, weight, age, notes) {
    return db.prepare(`
        INSERT INTO animals (owner_phone, name, breed, weight, age, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(owner_phone, name, breed, weight, age, notes);
}

// Listar animais do usuário
export function getAnimalsByUser(owner_phone) {
    return db.prepare(`SELECT * FROM animals WHERE owner_phone = ?`)
             .all(owner_phone);
}

// Buscar animal específico pelo ID
export function getAnimalById(id) {
    return db.prepare(`SELECT * FROM animals WHERE id = ?`).get(id);
}

// Atualizar animal (sistema antigo)
export function updateAnimal(id, name, breed, weight, age, notes) {
    return db.prepare(`
        UPDATE animals
        SET name = ?, breed = ?, weight = ?, age = ?, notes = ?
        WHERE id = ?
    `).run(name, breed, weight, age, notes, id);
}

// Deletar animal
export function deleteAnimal(id) {
    return db.prepare(`DELETE FROM animals WHERE id = ?`).run(id);
}


// ==============================================
// 3️⃣ FUNÇÕES USERS
// ==============================================

export function getUser(phone) {
    return db.prepare("SELECT * FROM users WHERE phone=?").get(phone);
}

export function createUser(phone, name = null) {
    db.prepare(`
        INSERT INTO users (phone, name, last_interaction, data)
        VALUES (?, ?, DATETIME('now'), '{}')
    `).run(phone, name);
}

export function updateUser(phone, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map(k => `${k}=?`).join(", ");

    db.prepare(`
        UPDATE users SET ${setClause} WHERE phone=?
    `).run(...values, phone);
}


// ==============================================
// 4️⃣ CONVERSAS / CONTEXTO
// ==============================================

export function addConversation(phone, role, message) {
    db.prepare(`
        INSERT INTO conversations (phone, role, message, timestamp)
        VALUES (?, ?, ?, DATETIME('now'))
    `).run(phone, role, message);
}

export function getConversationHistory(phone, limit = 10) {
    return db.prepare(`
        SELECT role, message FROM conversations
        WHERE phone=?
        ORDER BY id DESC
        LIMIT ?
    `).all(phone, limit).reverse();
}

export function clearConversation(phone) {
    db.prepare("DELETE FROM conversations WHERE phone=?").run(phone);
}


// ==============================================
// 5️⃣ DIAGNÓSTICOS
// ==============================================

export function saveDiagnostic(phone, category, data) {
    db.prepare(`
        INSERT INTO diagnostics (phone, category, data, created_at)
        VALUES (?, ?, ?, DATETIME('now'))
    `).run(phone, category, JSON.stringify(data));
}

export function getDiagnostics(phone) {
    return db.prepare(`
        SELECT * FROM diagnostics WHERE phone=? ORDER BY id DESC
    `).all(phone);
}


// ==============================================
// 6️⃣ NOVO SISTEMA – LOTES
// ==============================================

// Registrar UM animal em um lote
export function addAnimalToLote(
    user,
    lote,
    tipo,
    raca,
    peso,
    idade,
    sexo,
    quantidade,
    observacao
) {
    return db.prepare(`
        INSERT INTO lotes (
            user_number, numero_lote, tipo, raca, peso, idade, sexo, quantidade, observacao
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user, lote, tipo, raca, peso, idade, sexo, quantidade, observacao);
}

// Listar todos os lotes registrados pelo usuário
export function getAllLotes(user) {
    return db.prepare(`
        SELECT numero_lote, COUNT(*) AS total_animais
        FROM lotes
        WHERE user_number = ?
        GROUP BY numero_lote
        ORDER BY numero_lote ASC
    `).all(user);
}

// Listar animais de um lote específico
export function getLote(user, lote) {
    return db.prepare(`
        SELECT *
        FROM lotes
        WHERE user_number = ? AND numero_lote = ?
        ORDER BY id ASC
    `).all(user, lote);
}


// ==============================================
// 7️⃣ EXPORT DB
// ==============================================

export default db;
