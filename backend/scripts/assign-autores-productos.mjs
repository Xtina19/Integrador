/**
 * Asigna id_autor correcto a cada Producto según título.
 * Uso: node scripts/assign-autores-productos.mjs
 */
import dotenv from 'dotenv'
import sql from 'mssql'

dotenv.config()

/** titulo exacto → { nombre, apellido } */
const LIBROS = [
  ['1984', 'George', 'Orwell'],
  ['21 lecciones para el siglo XXI', 'Yuval Noah', 'Harari'],
  ['Alicia en el país de las maravillas', 'Lewis', 'Carroll'],
  ['Ana Karenina', 'León', 'Tolstói'],
  ['Así habló Zaratustra', 'Friedrich', 'Nietzsche'],
  ['Becoming: Mi historia', 'Michelle', 'Obama'],
  ['Breve historia del tiempo', 'Stephen', 'Hawking'],
  ['Charlie y la fábrica de chocolate', 'Roald', 'Dahl'],
  ['Cien años de soledad', 'Gabriel García', 'Márquez'],
  ['Clean Code', 'Robert C.', 'Martin'],
  ['Como agua para chocolate', 'Laura', 'Esquivel'],
  ['Cómo ganar amigos e influir sobre las personas', 'Dale', 'Carnegie'],
  ['Conversación en La Catedral', 'Mario Vargas', 'Llosa'],
  ['Cosmos', 'Carl', 'Sagan'],
  ['Crepúsculo', 'Stephenie', 'Meyer'],
  ['Crimen y castigo', 'Fiódor', 'Dostoyevski'],
  ['Crónica de un asesino de reyes', 'Patrick', 'Rothfuss'],
  ['Crónica de una muerte anunciada', 'Gabriel García', 'Márquez'],
  ['Cumbres borrascosas', 'Emily', 'Brontë'],
  ['De ratones y hombres', 'John', 'Steinbeck'],
  ['Don Quijote de la Mancha', 'Miguel de', 'Cervantes'],
  ['Drácula', 'Bram', 'Stoker'],
  ['Dune', 'Frank', 'Herbert'],
  ['El alquimista', 'Paulo', 'Coelho'],
  ['El amor en los tiempos del cólera', 'Gabriel García', 'Márquez'],
  ['El arte de la guerra', 'Sun', 'Tzu'],
  ['El código Da Vinci', 'Dan', 'Brown'],
  ['El conde de Montecristo', 'Alexandre', 'Dumas'],
  ['El diario de Ana Frank', 'Ana', 'Frank'],
  ['El gen egoísta', 'Richard', 'Dawkins'],
  ['El gran Gatsby', 'F. Scott', 'Fitzgerald'],
  ['El Hobbit', 'J. R. R.', 'Tolkien'],
  ['El hobbit', 'J. R. R.', 'Tolkien'],
  ['El hombre en busca de sentido', 'Viktor', 'Frankl'],
  ['El llano en llamas', 'Juan', 'Rulfo'],
  ['El malestar en la cultura', 'Sigmund', 'Freud'],
  ['El monje que vendió su Ferrari', 'Robin', 'Sharma'],
  ['El nombre del viento', 'Patrick', 'Rothfuss'],
  ['El paciente silencioso', 'Alex', 'Michaelides'],
  ['El poder del ahora', 'Eckhart', 'Tolle'],
  ['El principito', 'Antoine de', 'Saint-Exupéry'],
  ['El Principito', 'Antoine de', 'Saint-Exupéry'],
  ['El proceso', 'Franz', 'Kafka'],
  ['El programador pragmático', 'Andrew', 'Hunt'],
  ['El psicoanalista', 'John', 'Katzenbach'],
  ['El resplandor', 'Stephen', 'King'],
  ['El retrato de Dorian Gray', 'Oscar', 'Wilde'],
  ['El señor de los anillos', 'J. R. R.', 'Tolkien'],
  ['El viejo y el mar', 'Ernest', 'Hemingway'],
  ['Fahrenheit 451', 'Ray', 'Bradbury'],
  ['Frankenstein', 'Mary', 'Shelley'],
  ['Fundación', 'Isaac', 'Asimov'],
  ['Grandes esperanzas', 'Charles', 'Dickens'],
  ['Guerra y paz', 'León', 'Tolstói'],
  ['Hábitos atómicos', 'James', 'Clear'],
  ['Harry Potter y la cámara secreta', 'J. K.', 'Rowling'],
  ['Harry Potter y la piedra filosofal', 'J. K.', 'Rowling'],
  ['Homo Deus', 'Yuval Noah', 'Harari'],
  ['Inferno', 'Dan', 'Brown'],
  ['Inteligencia emocional', 'Daniel', 'Goleman'],
  ['It', 'Stephen', 'King'],
  ['Jane Eyre', 'Charlotte', 'Brontë'],
  ['Juego de tronos', 'George R.R.', 'Martin'],
  ['La casa de los espíritus', 'Isabel', 'Allende'],
  ['La casa verde', 'Mario Vargas', 'Llosa'],
  ['La chica del tren', 'Paula', 'Hawkins'],
  ['La ciudad y los perros', 'Mario Vargas', 'Llosa'],
  ['La Ilíada', 'Homero', '-'],
  ['La metamorfosis', 'Franz', 'Kafka'],
  ['La Odisea', 'Homero', '-'],
  ['La perla', 'John', 'Steinbeck'],
  ['La sombra del viento', 'Carlos Ruiz', 'Zafón'],
  ['La tregua', 'Mario', 'Benedetti'],
  ['Las crónicas de Narnia', 'C.S.', 'Lewis'],
  ['Las uvas de la ira', 'John', 'Steinbeck'],
  ['Los 7 hábitos de la gente altamente efectiva', 'Stephen', 'Covey'],
  ['Los hermanos Karamázov', 'Fiódor', 'Dostoyevski'],
  ['Los juegos del hambre', 'Suzanne', 'Collins'],
  ['Los miserables', 'Victor', 'Hugo'],
  ['Los pilares de la tierra', 'Ken', 'Follett'],
  ['Los renglones torcidos de Dios', 'Torcuato Luca de', 'Tena'],
  ['Los tres mosqueteros', 'Alexandre', 'Dumas'],
  ['Matar a un ruiseñor', 'Harper', 'Lee'],
  ['Matilda', 'Roald', 'Dahl'],
  ['Meditaciones', 'Marco', 'Aurelio'],
  ['Nuestra Señora de París', 'Victor', 'Hugo'],
  ['Oliver Twist', 'Charles', 'Dickens'],
  ['Orgullo y prejuicio', 'Jane', 'Austen'],
  ['Padre Rico, Padre Pobre', 'Robert', 'Kiyosaki'],
  ['Pedro Páramo', 'Juan', 'Rulfo'],
  ['Perdida', 'Gillian', 'Flynn'],
  ['Piense y hágase rico', 'Napoleon', 'Hill'],
  ['Por quién doblan las campanas', 'Ernest', 'Hemingway'],
  ['Rayo de luna', 'Amado', 'Nervo'],
  ['Rayuela', 'Julio', 'Cortázar'],
  ['Sapiens: De animales a dioses', 'Yuval Noah', 'Harari'],
  ['Sentido y sensibilidad', 'Jane', 'Austen'],
  ['Steve Jobs', 'Walter', 'Isaacson'],
  ['Un mundo feliz', 'Aldous', 'Huxley'],
  ['Un mundo sin fin', 'Ken', 'Follett'],
  ['Veinte poemas de amor y una canción desesperada', 'Pablo', 'Neruda'],
  ['Veronika decide morir', 'Paulo', 'Coelho'],
  ['Yo, robot', 'Isaac', 'Asimov'],
]

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const MAPA_TITULO = new Map(
  LIBROS.map(([titulo, nombre, apellido]) => [normalize(titulo), { nombre, apellido }])
)

/** Variantes de nombre/apellido → forma canónica */
const ALIAS_AUTOR = [
  [{ nombre: 'J.R.R.', apellido: 'Tolkien' }, { nombre: 'J. R. R.', apellido: 'Tolkien' }],
  [{ nombre: 'J K', apellido: 'Rowling' }, { nombre: 'J. K.', apellido: 'Rowling' }],
  [{ nombre: 'J.K.', apellido: 'Rowling' }, { nombre: 'J. K.', apellido: 'Rowling' }],
]

function canonicalAutor(autor) {
  const n = normalize(autor.nombre).replace(/\./g, '').replace(/\s+/g, ' ')
  const a = normalize(autor.apellido)
  for (const [from, to] of ALIAS_AUTOR) {
    const fn = normalize(from.nombre).replace(/\./g, '')
    const fa = normalize(from.apellido)
    if (n.includes(fn) && a === fa) return to
  }
  return autor
}

async function ensureAutor(pool, raw) {
  const { nombre, apellido } = canonicalAutor(raw)

  const hit = await pool
    .request()
    .input('n', sql.VarChar(100), nombre)
    .input('a', sql.VarChar(100), apellido)
    .query(`
      SELECT TOP 1 id_autor FROM Autor
      WHERE nombre = @n AND apellido = @a
      ORDER BY id_autor
    `)
  if (hit.recordset[0]) return hit.recordset[0].id_autor

  const ins = await pool
    .request()
    .input('n', sql.VarChar(100), nombre)
    .input('a', sql.VarChar(100), apellido)
    .query(`
      INSERT INTO Autor (nombre, apellido)
      OUTPUT INSERTED.id_autor
      VALUES (@n, @a)
    `)
  return ins.recordset[0].id_autor
}

async function mergeAutorAlias(pool) {
  let merged = 0
  for (const [from, to] of ALIAS_AUTOR) {
    const rows = await pool
      .request()
      .input('n', sql.VarChar(100), from.nombre)
      .input('a', sql.VarChar(100), from.apellido)
      .query(`SELECT id_autor FROM Autor WHERE nombre = @n AND apellido = @a`)

    const canonId = await ensureAutor(pool, to)
    for (const row of rows.recordset) {
      if (row.id_autor === canonId) continue
      await pool
        .request()
        .input('from', sql.Int, row.id_autor)
        .input('to', sql.Int, canonId)
        .query(`UPDATE Producto SET id_autor = @to WHERE id_autor = @from`)
      await pool
        .request()
        .input('id', sql.Int, row.id_autor)
        .query(`DELETE FROM Autor WHERE id_autor = @id`)
      merged += 1
      console.log(`↪ Autor #${row.id_autor} (${from.nombre} ${from.apellido}) → #${canonId}`)
    }
  }
  return merged
}

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: { encrypt: true, trustServerCertificate: true },
}

async function main() {
  const pool = await sql.connect(config)

  const merged = await mergeAutorAlias(pool)
  if (merged) console.log(`Autores alias consolidados: ${merged}\n`)

  const productos = await pool.request().query(`
    SELECT p.id_producto, p.titulo, p.id_autor,
           a.nombre AS autor_nombre, a.apellido AS autor_apellido
    FROM Producto p
    INNER JOIN Autor a ON a.id_autor = p.id_autor
    ORDER BY p.titulo
  `)

  let updated = 0
  let ok = 0
  let sinMapa = 0

  for (const p of productos.recordset) {
    const esperado = MAPA_TITULO.get(normalize(p.titulo))
    if (!esperado) {
      sinMapa += 1
      console.warn(`? Sin regla: "${p.titulo}" (actual: ${p.autor_nombre} ${p.autor_apellido})`)
      continue
    }

    const canon = canonicalAutor(esperado)
    const idAutor = await ensureAutor(pool, canon)

    if (p.id_autor === idAutor) {
      ok += 1
      continue
    }

    await pool
      .request()
      .input('id', sql.Int, p.id_producto)
      .input('autor', sql.Int, idAutor)
      .query(`UPDATE Producto SET id_autor = @autor WHERE id_producto = @id`)

    updated += 1
    console.log(`✓ ${p.titulo} → ${canon.nombre} ${canon.apellido}`)
  }

  console.log(`\nListo: ${updated} corregidos, ${ok} ya correctos, ${sinMapa} sin regla.`)
  await pool.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
