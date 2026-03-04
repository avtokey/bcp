import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import dns from "dns";

// Prefer IPv4 globally to avoid ENETUNREACH on IPv6-only hosts like Supabase on Render
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use DATABASE_URL from environment variables
const dbUrl = process.env.DATABASE_URL;

if (dbUrl) {
  try {
    const parsedUrl = new URL(dbUrl);
    console.log(`[DB Debug] Target Host: ${parsedUrl.hostname}, Port: ${parsedUrl.port || '5432'}`);
    if (parsedUrl.port === '5432') {
      console.warn("⚠️ WARNING: You are using port 5432 (Direct Connection). Render.com Free tier often requires the Pooler (port 6543) to work correctly.");
    }
  } catch (e) {
    console.error("[DB Debug] Failed to parse DATABASE_URL");
  }
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const upload = multer({ dest: 'uploads/' });

// Initialize database
async function initDb() {
  console.log("Attempting to connect to database...");
  let client;
  try {
    client = await pool.connect();
    console.log("Successfully connected to PostgreSQL!");
    await client.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT,
        staff_info TEXT,
        remote_access INTEGER DEFAULT 0,
        problem_type TEXT,
        other_details TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, staff_info)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS app_metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);
  } catch (err) {
    console.error("Database initialization failed:", err);
    throw err;
  } finally {
    if (client) client.release();
  }
}

// Seed initial data
async function seedInitialData() {
  let client;
  try {
    client = await pool.connect();
    const dept1 = "საბანკო სერვისების განვითარების დეპარტამენტი";
    const dept2 = "ციფრული ბანკინგის დეპარტამენტი";
    const dept3 = "ბიზნეს ანალიტიკისა და რეპორტინგის დეპარტამენტი (AI გუნდი)";
    const dept4 = "საკრედიტო სისტემების დეპარტამენტი";
    const dept5 = "DWH-ის დეპარტამენტი";
    const dept6 = "პროცესინგის დეპარტამენტი";
    const dept7 = "ავტომატიზაციის გუნდი";

    const initialStaff: [string, string, string][] = [
      ["ანი გიორგაძე", dept1, "A0314 | Ani.Giorgadze@lb.ge"],
      ["რუსუდანი ხაჟომია", dept1, "B0713 | Rusudan.Khazhomia@lb.ge"],
      ["ხათუნა გიორგაძე", dept1, "B0714 | Khato.Giorgadze@lb.ge"],
      ["თამთა ტომარაძე", dept1, "A0962 | Tamta.Tomaradze@lb.ge"],
      ["ნინო ღუნაშვილი", dept1, "A0621 | Nino.Gunashvili@lb.ge"],
      ["ელენე პეიტრიშვილი", dept1, "A1023 | Elene.Peitrishvili@lb.ge"],
      ["თეონა ტუღუში", dept1, "A0603 | Teona.Tugushi@lb.ge"],
      ["მარინა ტომოზოვა", dept1, "A5351 | Marina.Tomozova@lb.ge"],
      ["ნათია წიკლაური", dept1, "A0857 | Natia.Tsiklauri@lb.ge"],
      ["ნინო პიტიურიშვილი", dept1, "A6411 | Nino.Pitiurishvili@lb.ge"],
      ["თამარი დეკანოიძე", dept1, "A9719 | Tamar.Dekanoidze@lb.ge"],
      ["სოფიო კაპანაძე", dept1, "B0513 | Sopio.Kapanadze@lb.ge"],
      ["ნინო ფერაძე", dept1, "A9003 | Nino.Pheradze@lb.ge"],
      ["თინათინ ყორღანაშვილი", dept1, "A8994 | Tinatin.Korghanashvili@lb.ge"],
      ["მარიკა მაკარიძე", dept1, "B2735 | Marika.Makaridze@lb.ge"],
      ["ვალენტინა ნათენაძე", dept1, "B2788 | Valentina.Natenadze@lb.ge"],
      ["თამარ როსტიაშვილი", dept1, "B3774 | Tamar.Rostiashvili@lb.ge"],
      ["თეონა კაპანაძე", dept1, "B5561 | T.Kapanadze@lb.ge"],
      ["ლია კიკვაძე", dept1, "B5684 | Lika.Kikvadze@lb.ge"],
      ["თამარ კავლელაშვილი", dept1, "B8707 | Tamar.Kavlelashvili@lb.ge"],
      ["პაატა შარიქაძე", dept1, "A0324 | Paata.Sharikadze@lb.ge"],
      ["თეიმურაზ მდინარაძე", dept1, "A0287 | Temuri.Mdinaradze@lb.ge"],
      ["სოფიკო თანიაშვილი", dept1, "B9092 | Sophiko.Taniashvili@lb.ge"],
      ["ავთანდილ ყავრელიშვილი", dept1, "B9144 | Avtandil.Kavrelishvi@lb.ge"],
      ["გიორგი კაკაშვილი", dept1, "B9280 | Giorgi.Kakashvili@lb.ge"],
      ["ნიკოლოზ მეზვრიშვილი", dept1, "B9830 | Nikoloz.Mezvrishvili@lb.ge"],
      ["გიორგი ძამაშვილი", dept1, "C0142 | Giorgi.Dzamashvili@lb.ge"],
      ["ელენე მჭედლიძე", dept1, "C0220 | Elene.Mchedlidze@lb.ge"],
      ["ხათუნა სურმანიძე", dept1, "C0659 | Khatuna.Surmanidze@lb.ge"],
      ["ელენე ორჯონიკიძე", dept1, "C1043 | Elene.Orjonikidze@lb.ge"],
      ["ვანო თინაშვილი", dept1, "C1157 | Vano.Tinashvili@lb.ge"],
      ["მაია მოწონელიძე", dept1, "C1326 | Maia.Motsonelidze@lb.ge"],
      ["ანა არველაძე", dept1, "C1873 | Ana.Arvelაძე@lb.ge"],
      ["ხათუნა ჭიოკაძე", dept1, "C2521 | Khatuna.Tchiokadze@lb.ge"],
      ["ნიკა რუხაძე", dept1, "C3209 | Nika.Rukhadze@lb.ge"],
      ["თემური კორკოტაშვილი", dept1, "C3352 | Temuri.Korkotashvili@lb.ge"],
      ["ირინა ვართანოვი", dept1, "C3400 | Irina.Vartanova@lb.ge"],
      ["მეგი ახალკაცი", dept1, "C3417 | Megi.Akhalkatsi@lb.ge"],
      ["დავითი კაკაშვილი", dept1, "C3760 | Daviti.Kakashvili@lb.ge"],
      ["ნათია ჩხიკვაძე", dept1, "C3781 | n.chkhikvadze@lb.ge"],
      ["ზურაბ წიკლაური", dept1, "C3860 | Zurab.Tsiklauri@lb.ge"],
      ["შალვა გიგაური", dept1, "C4392 | Shalva.Gigauri@lb.ge"],
      ["გოგა გაჩეჩილაძე", dept1, "C4562 | Goga.Gachechiladze@lb.ge"],
      ["გიორგი ცისკაძე", dept1, "C4564 | Giorgi.Tsiskadze@lb.ge"],
      ["ბაკურ სიხარულიძე", dept1, "C4691 | Bakur.Sikharulidze@lb.ge"],
      ["დავით მამფორია", dept1, "C4693 | Davit.Mamporia@lb.ge"],
      ["ფიქრია თეთრაშვილი", dept1, "C4790 | Pikria.Tetrashvili@lb.ge"],
      ["ნიკა კლდიაშვილი", dept1, "C4826 | Nika.Kldiashvili@lb.ge"],
      ["მარიამი კობახიძე", dept1, "C4886 | Mariami.Kobakhidze@lb.ge"],
      ["მიხეილ სადრაძე", dept1, "C4955 | Mikheil.Sadradze@lb.ge"],
      ["ვასილი პაპიაშვილი", dept1, "C5332 | Vasil.Papiashvili@lb.ge"],
      ["ნინო ცხვედიანი", dept1, "C5354 | Nino.Tskhvediani@lb.ge"],
      ["გიორგი ჭიღლაძე", dept1, "C5400 | Giorgi.Chighladze@lb.ge"],
      ["ზვიად ჭანტურია", dept1, "C5688 | Zviad.Tchanturia@lb.ge"],
      ["ბექა კაჭკაჭაშვილი", dept1, "C5829 | B.Katchkatchashvili@lb.ge"],
      ["ლელა ხითარიშვილი", dept1, "C5968 | Lela.Khitarishvili@lb.ge"],
      ["გიორგი მირზაშვილი", dept1, "C5974 | Giorgi.Mirzashvili@lb.ge"],
      ["გიორგი შაქარაშვილი", dept1, "C6047 | George.Shakarashvili@lb.ge"],
      ["საბა ჯაბაური", dept1, "C6074 | Saba.Jabauri@lb.ge"],
      ["მზექალა არაბული", dept1, "C6344 | Mzekala.Arabuli@lb.ge"],
      ["მარიამ შევარდნაძე", dept1, "C6443 | Mariam.Shevardnadze@lb.ge"],
      ["გიორგი გელაშვილი", dept1, "C6749 | Giorgi.Gelashvili@lb.ge"],
      ["ნუგზარი ამონაშვილი", dept1, "C6817 | Nugzari.Amonashvili@lb.ge"],
      ["დავითი შადური", dept1, "C6822 | Daviti.Shaduri@lb.ge"],
      ["ლევანი ფილფანი", dept1, "C6823 | Levani.Pilpani@lb.ge"],
      ["ანა ცანავა", dept1, "C6824 | Ana.Tsanava@lb.ge"],
      ["ჯემალ მოწყობილი", dept1, "C7385 | Jemal.Motskobili@lb.ge"],
      ["ნანა მამულია", dept1, "C8416 | Nana.Mamulia@lb.ge"],
      ["გურამ აფხაზავა", dept1, "C8982 | Guram.Apkhazava@lb.ge"],
      ["რაისა ბადალოვა", dept1, "C8983 | Raisa.Badalova@lb.ge"],
      ["გიორგი დანელია", dept1, "C9021 | Giorgi.Danelia@lb.ge"],
      ["რამაზ ბლუაშვილი", dept1, "C9104 | Ramaz.Bluashvili@lb.ge"],
      ["ანა თორია", dept1, "C9129 | Ana.Toria@lb.ge"],
      ["ნათია მახათაძე", dept1, "C9347 | Natia.Makhatadze@lb.ge"],
      ["ავრაამი ბადალოვი", dept1, "C9606 | Avraami.Badalovi@lb.ge"],
      ["სოფიკო ჩიტაძე", dept1, "C9638 | Sopiko.Chitadze@lb.ge"],
      ["დავითი გიორგაძე", dept1, "D0025 | Daviti.Giorgadze@lb.ge"],
      ["სოფიო გვენეტაძე", dept1, "D0026 | Sopio.Gvenetadze@lb.ge"],
      ["ნუგზარი როსტიაშვილი", dept1, "D0352 | Nugzari.Rostiashvili@lb.ge"],
      ["ბაია დიდიშვილი", dept1, "D0450 | Baia.Didishvili@lb.ge"],
      ["ნინელი ქოჩქიანი", dept1, "D0728 | Nineli.Kochkiani@lb.ge"],
      ["გიორგი უჩანეიშვილი", dept1, "D0763 | Giorgi.Uchaneishvili@lb.ge"],
      ["ზეზვა მებაღიშვილი", dept1, "D1020 | Zezva.Mebagishvili@lb.ge"],
      ["ლევან მთივლიშვილი", dept1, "levan.mtivlishvili@lb.ge"],
      ["გოდერძი ლომინეიშვილი", dept1, "goderdzi.lomineishvili@lb.ge"],
      ["ბექა ნასუაშვილი", dept1, "beka.nashuashvili@lb.ge"],
      ["მედეა გეორბელიძე", dept1, "dea.georbelidze@lb.ge"],
      ["ნინო დევდარიანი", dept1, "nino.devdariani@lb.ge"],
      ["გიორგი ასლანიშვილი", dept1, "Giorgi.Aslanishvili@lb.ge"],
      ["ლუკა რევაზიშვილი", dept1, "Luka.Revazishvili@lb.ge"],
      ["თორნიკე ენუქიძე", dept1, "Tornike.Enukidze@lb.ge"],

      // ციფრული ბანკინგის დეპარტამენტი
      ["ელენე ჩუბინიძე", dept2, "A4680 | elene.chubinidze@lb.ge"],
      ["გიორგი ბიბილეიშვილი", dept2, "C4052 | Giorgi.Bibileishvili@lb.ge"],
      ["გიორგი სამუშია", dept2, "C4327 | Giorgi.Samushia@lb.ge"],
      ["ქეთევან გიორგაძე", dept2, "C5252 | Ketevan.Giorgadze@lb.ge"],
      ["ანდრია შიხიაშვილი", dept2, "C8774 | Andria.Shikhiashvili@lb.ge"],
      ["გიორგი წერეთელი", dept2, "C9028 | Giorgi.Tsereteli@lb.ge"],
      ["ლევან ბჟალავა", dept2, "C9465 | Levan.Bzhalava@lb.ge"],
      ["გიორგი გუგულაშვილი", dept2, "C9918 | Giorgi.Gugulashvili@lb.ge"],
      ["თამარ ოქრუაძე", dept2, "C9845 | Tamar.Okruadze@lb.ge"],
      ["სოფიო კახაია", dept2, "D0421 | Sopio.Kakhaia@lb.ge"],
      ["დიანა გრიგალაშვილი", dept2, "D0747 | Diana.Grigalashvili@lb.ge"],
      ["ნიკოლოზ შენგელია", dept2, "D0893 | Nikoloz.Shengelia@lb.ge"],
      ["თინა ხარატიშვილი", dept2, "D0964 | Tina.Kharatishvili@lb.ge"],
      ["მარიამ ბურჯანაძე", dept2, "D1119 | Mariam.Burjanadze@lb.ge"],
      ["ალექსანდრე ბოლქვაძე", dept2, "A6143 | Aleksandre.Bolkvadze@lb.ge"],
      ["ნოდარ როშკიუს", dept2, "B0035 | Nodar.Roshkiusi@lb.ge"],
      ["გრიგოლ ლოლაძე", dept2, "A0464 | giorgi.loladze@lb.ge"],
      ["ნათია ჭეიშვილი", dept2, "A4619 | Natia.Tcheishvili@lb.ge"],
      ["ნელი ოქრომჭედლიშვილი", dept2, "A1462 | Neli.Okromchedlishvili@lb.ge"],
      ["ნინო ლომსაძე", dept2, "A7220 | Nino.Lomsadze@lb.ge"],
      ["გიორგი გაგუა", dept2, "A9624 | Giorgi.Gagua@lb.ge"],
      ["გოგა პაპიძე", dept2, "B2691 | Goga.Papidze@lb.ge"],
      ["ზურაბ კუპრაძე", dept2, "B6656 | Zurab.Kupradze@lb.ge"],
      ["ავთანდილ რუხაძე", dept2, "B8588 | Avto.Rukhadze@lb.ge"],
      ["ციალა პეპანაშვილი", dept2, "B8675 | Tsiala.Pepanashvili@lb.ge"],
      ["ეკა გელაშვილი", dept2, "B9075 | Eka.Gelashvili@lb.ge"],
      ["გულისა მერებაშვილი", dept2, "B9306 | Gulisa.Merebashvili@lb.ge"],
      ["ალექსანდრე ებანოიძე", dept2, "B9442 | Aleksandre.Ebanoidze@lb.ge"],
      ["დავითი მაჩიტიძე", dept2, "C0083 | Davit.Machitidze@lb.ge"],
      ["ირაკლი როსტიაშვილი", dept2, "C0171 | Irakli.Rostiashvili@lb.ge"],
      ["რომან კვიკვინია", dept2, "C1194 | Roman.Kvikvinia@lb.ge"],
      ["ნაია ჩინჩალაძე", dept2, "C1536 | Naia.Chinchaladze@lb.ge"],
      ["მერი მჭედლიშვილი", dept2, "C1806 | Meri.Mtchedlishvili@lb.ge"],
      ["ცირა პაქსაშვილი", dept2, "C2537 | Tsira.Paksashvili@lb.ge"],
      ["გიორგი დიღმელაშვილი", dept2, "C3203 | Giorgi.Digmelashvili@lb.ge"],
      ["მარიამ ჩაჩანიძე", dept2, "C3396 | Mariam.Chachanidze@lb.ge"],
      ["ზურაბი წვერავა", dept2, "C3640 | Zurabi.Tsverava@lb.ge"],
      ["ჯუმბერ სუხიაშვილი", dept2, "C3728 | Jumber.Sukhiashvili@lb.ge"],
      ["სალომე ბეჟანიძე", dept2, "B7289 | Salome.Bezhanidze@lb.ge"],
      ["ლევანი მიგრიაული", dept2, "C4887 | Levani.Migriauli@lb.ge"],
      ["ნელი ზაქარეიშვილი", dept2, "C4942 | Neli.Zakareishvili@lb.ge"],
      ["ქეთევან ბურდული", dept2, "C4953 | Ketevan.Burduli@lb.ge"],
      ["ზურაბ რევაზიშვილი", dept2, "C5513 | Zurab.Revazishvili@lb.ge"],
      ["პაატა ქურდაძე", dept2, "C5616 | Paata.Kurdadze@lb.ge"],
      ["რეზო ჯოგლიძე", dept2, "C5807 | Rezo.Joglidze@lb.ge"],
      ["გიორგი ლატარია", dept2, "C5809 | Giorgi.Lataria@lb.ge"],
      ["ნიკა ტორუა", dept2, "C5985 | Nika.Torua@lb.ge"],
      ["გიორგი შამუგია", dept2, "C6243 | G.Shamugia@lb.ge"],
      ["სალომე დგებუაძე", dept2, "C6444 | Salome.Dgebuadze@lb.ge"],
      ["გიორგი იაშვილი", dept2, "C6672 | G.Iashvili@lb.ge"],
      ["თამარი სესკურია", dept2, "C6986 | Tamari.Seskuria@lb.ge"],
      ["ლაშა დარჩიაშვილი", dept2, "C7025 | Lasha.Darchiashvili@lb.ge"],
      ["ირაკლი ტორუა", dept2, "C7107 | Irakli.Torua@lb.ge"],
      ["თორნიკე კაჭკაჭიშვილი", dept2, "C7224 | To.Katchkatchishvili@lb.ge"],
      ["ალექსანდრე ჯანიაშვილი", dept2, "C8862 | A.Janiashvili@lb.ge"],
      ["დაჩი გოშაძე", dept2, "C8945 | Dachi.Goshadze@lb.ge"],
      ["აკაკი ქაშიბაძე", dept2, "C8981 | Akaki.Kashibadze@lb.ge"],
      ["ნინო გელაშვილი", dept2, "C9588 | Ni.Gelashvili@lb.ge"],
      ["ვლადიმერ გოგოლიძე", dept2, "C9618 | Lado.Gogolidze@lb.ge"],
      ["ირაკლი ხოჭავა", dept2, "C9637 | Irakli.Khotchava@lb.ge"],
      ["გიორგი ხომერიკი", dept2, "C9640 | Giorgi.Khomeriki@lb.ge"],
      ["მეგი ქორჩაშვილი", dept2, "D0024 | Megi.Korchashvili@lb.ge"],
      ["გიორგი ნიჟარაძე", dept2, "D0106 | Giorgi.Nizharadze@lb.ge"],
      ["თინა აქირთავა", dept2, "D0107 | Tina.Akirtava@lb.ge"],
      ["რევაზ ლაგვილავა", dept2, "D0286 | Revaz.Lagvilava@lb.ge"],
      ["ელენე გარსევანიშვილი", dept2, "D0449 | E.Garsevanishvili@lb.ge"],
      ["საბა შუბითიძე", dept2, "D0464 | Saba.Shubitidze@lb.ge"],
      ["ლევანი გამეზარდაშვილი", dept2, "D0656 | L.Gamezardashvili@lb.ge"],
      ["დავითი გეგია", dept2, "D0764 | David.Gegia@lb.ge"],
      ["სალომე გოგია", dept2, "D0789 | Salome.Gogia@lb.ge"],
      ["სოფიკო ფოჩხუა", dept2, "D0869 | Sophiko.Pochkhua@lb.ge"],
      ["ნინო კუბლაშვილი", dept2, "D0873 | Nino.Kublashvili@lb.ge"],
      ["გიორგი ნინიძე", dept2, "D0946 | Giorgi.Ninidze@lb.ge"],
      ["ქეთი ჩილინდრიშვილი", dept2, "D0957 | Keti.Chilindrishvili@lb.ge"],
      ["გიორგი კუცია", dept2, "D0962 | Giorgi.Kutsia@lb.ge"],
      ["ნანა წიწიკაშვილი", dept2, "D1049 | Nana.Tsitsikashvili@lb.ge"],

      // ბიზნეს ანალიტიკისა და რეპორტინგის დეპარტამენტი (AI გუნდი)
      ["ალექსანდრე ლომაძე", dept3, "B8897 | Aleksandre.Lomadze@lb.ge"],
      ["თენგიზი გაბიტაშვილი", dept3, "C3107 | Tengizi.Gabitashvili@lb.ge"],
      ["ელენე მელქაძე", dept3, "C3194 | Elene.Melkadze@lb.ge"],
      ["ანა ბურდულაძე", dept3, "C3507 | Ana.Burduladze@lb.ge"],
      ["ბაგრატი მჭედლიძე", dept3, "C5076 | Bagrati.Mchedlidze@lb.ge"],
      ["მარიამ ონიანი", dept3, "C5569 | Mariam.Oniani@lb.ge"],
      ["ქეთევან მონიავა", dept3, "C9229 | Ketevan.Moniava@lb.ge"],
      ["საბა კობახიძე", dept3, "C9893 | Saba.Kobakhidze@lb.ge"],
      ["ნიკოლოზ მიქაბერიძე", dept3, "D0581 | Nikoloz.Mikaberidze@lb.ge"],
      ["ალექსანდრე ბალიაშვილი", dept3, "D0592 | A.Baliashvili@lb.ge"],

      // საკრედიტო სისტემების დეპარტამენტი
      ["თამარ სირაძე", dept4, "A8050 | Tamar.Siradze@lb.ge"],
      ["ბესიკი ზივზივაძე", dept4, "B1664 | Besik.Zivzivadze@lb.ge"],
      ["შაკო სადუნაშვილი", dept4, "B3134 | Shako.Sadunashvili@lb.ge"],
      ["დავით სიმონიშვილი", dept4, "B3884 | Davit.Simonishvili@lb.ge"],
      ["დემეტრე კამკამიძე", dept4, "B8447 | Demetre.Kamkamidze@lb.ge"],
      ["დიმიტრი რაქვიაშვილი", dept4, "B9159 | Dimitri.Rakviashvili@lb.ge"],
      ["თამარ აფრიდონიძე", dept4, "B9942 | Tamar.Apridonidze@lb.ge"],
      ["თამთა კირვალიძე", dept4, "C0020 | Tamta.Kirvalidze@lb.ge"],
      ["შორენა გელაშვილი", dept4, "C0874 | S.Gelashvili@lb.ge"],
      ["ნიკა ყარყარაშვილი", dept4, "C1096 | Nika.Karkarashvili@lb.ge"],
      ["თამარ ფუტკარაძე", dept4, "C1460 | T.Putkaradze@lb.ge"],
      ["ვახტანგ პავლიაშვილი", dept4, "C3491 | Vakhtang.Pavliashvili@lb.ge"],
      ["ელენა ებიტაშვილი", dept4, "C3712 | Elena.Ebitashvili@lb.ge"],
      ["ალექსანდრა პარიკოჟა", dept4, "C5867 | Aleksandra.Parikozha@lb.ge"],
      ["ანა მღებრიშვილი", dept4, "C6802 | Ana.Mgebrishvili@lb.ge"],
      ["ნინო ხელაძე", dept4, "C6919 | N.Kheladze@lb.ge"],
      ["გიორგი ნაყეური", dept4, "C7393 | Giorgi.Nakeuri@lb.ge"],
      ["აკაკი გაბისონია", dept4, "C7797 | Akaki.Gabisonia@lb.ge"],
      ["დავით ბუაჩიძე", dept4, "C7799 | Davit.Buachidze@lb.ge"],
      ["ვაჟა ჯამბაზიშვილი", dept4, "C7849 | Vazha.Jambazishvili@lb.ge"],
      ["მაია ლაშხია", dept4, "C7882 | Maia.Lashkhia@lb.ge"],
      ["ბექა ალიბეგაშვილი", dept4, "C9151 | Beka.Alibegashvili@lb.ge"],
      ["მიხეილ ჩუბინიძე", dept4, "C9302 | Mikheil.Chubinidze@lb.ge"],
      ["ანა ტაბატაძე", dept4, "C9578 | An.Tabatadze@lb.ge"],
      ["ანა მიგრიაული", dept4, "C9601 | Ana.Migriauli@lb.ge"],
      ["მანუჩარ ჩაჩანიძე", dept4, "C9870 | Manuchar.Chachanidze@lb.ge"],
      ["ვალერი ბარბაქაძე", dept4, "D0226 | Valeri.Barbakadze@lb.ge"],
      ["მარიამ კუპატაძე", dept4, "D0837 | Mariam.Kupatadze@lb.ge"],
      ["დავით მაკალათია", dept4, "davit.makalatia@lb.ge"],
      ["გელა ჩადუნელი", dept4, "gela.chaduneli@lb.ge"],

      // DWH-ის დეპარტამენტი
      ["კონსტანტინე რაქვიაშვილი", dept5, "C4863 | K.Rakviashvili@lb.ge"],
      ["ეთერი ნიორაძე", dept5, "B8757 | Eteri.Nioradze@lb.ge"],
      ["გიგა მიქაუტაძე", dept5, "C6545 | Giga.Mikautadze@lb.ge"],
      ["შორენა მიმინოშვილი", dept5, "A0434 | shorena.miminoshvili@lb.ge"],
      ["მარიამ კოპალეიშვილი", dept5, "D1001 | Mariam.Kopaleishvili@lb.ge"],
      ["ნინო ჩხაიძე", dept5, "A0109 | Nino.Chxaidze@lb.ge"],
      ["ლერი მეგრელიშვილი", dept5, "C0919 | Leri.Megrelishvili@lb.ge"],
      ["ხათუნა მუხაშავრია", dept5, "C5066 | Khatuna.Mukhashavria@lb.ge"],
      ["ქეთევან მეტრეველი", dept5, "C6908 | K.Metreveli@lb.ge"],
      ["მარიამი როსტიაშვილი", dept5, "C6906 | M.Rostiashvili@lb.ge"],
      ["ნინო ვარაზაშვილი", dept5, "B3352 | N.Varazashvili@lb.ge"],
      ["ლალა ღვინეფაძე", dept5, "D0297 | Lala.Gvinepadze@lb.ge"],
      ["გურამი დოლიძე", dept5, "C6905 | Gurami.Dolidze@lb.ge"],
      ["ბექა მულაძე", dept5, "C5267 | Beka.Muladze@lb.ge"],
      ["მაგდა ლომსაძე", dept5, "C2809 | Magda.Lomsadze@lb.ge"],
      ["თეონა ლილუაშვილი", dept5, "C8802 | Teona.Liluashvili@lb.ge"],
      ["მიხეილი ნანობაშვილი", dept5, "C6913 | M.Nanobashvili@lb.ge"],
      ["ბესიკ ივანიძე", dept5, "B8772 | Besik.Ivanidze@lb.ge"],
      ["თეონა გელაშვილი", dept5, "B4530 | Teona.Gelashvili@lb.ge"],
      ["გიორგი მეგენეიშვილი", dept5, "D0463 | G.Megeneishvili@lb.ge"],
      ["სოფია ხაბალაშვილი", dept5, "C7938 | Sopia.Khabalashvili@lb.ge"],
      ["ნათია ქევხიშვილი", dept5, "C8846 | Natia.Kevkhishvili@lb.ge"],
      ["ხათუნა ადუაშვილი", dept5, "A0103 | khatuna.aduashvili@lb.ge"],
      ["ნინა დიასამიძე", dept5, "D0295 | Nina.Diasamidze@lb.ge"],
      ["ლილე ქუთელია", dept5, "D0461 | Lile.Kutelia@lb.ge"],
      ["მათე ადამია", dept5, "C6814 | Mate.Adamia@lb.ge"],
      ["მამუკა მუმლაძე", dept5, "C6813 | Mamuka.Mumladze@lb.ge"],
      ["გივი აბესაძე", dept5, "C6812 | Givi.Abesadze@lb.ge"],
      ["დავით გორგილაძე", dept5, "D0447 | Davit.Gorgiladze@lb.ge"],

      // პროცესინგის დეპარტამენტი
      ["ალექსანდრე მდინარაძე", dept6, "B0657 | Aleksandre.Mdinaradze@lb.ge"],
      ["ირაკლი კუბლაშვილი", dept6, "A0396 | irakli.kublashvili@lb.ge"],
      ["დავით ჩაჩავა", dept6, "B0165 | David.Chachava@lb.ge"],
      ["ვაჟა მაისურაძე", dept6, "A0397 | vaja.maisuradze@lb.ge"],
      ["დიმიტრი ბერიძე", dept6, "A0399 | dima.beridze@lb.ge"],
      ["ზვიად ბაბლიძე", dept6, "A0400 | zviad.bablidze@lb.ge"],
      ["ზურაბ სადრაძე", dept6, "A3869 | zurab.sadradze@lb.ge"],
      ["დავით ჩიქოვანი", dept6, "A3868 | david.chikovani@lb.ge"],
      ["ედუარდ ფეიქრიშვილი", dept6, "A0402 | eduard.peikrishvili@lb.ge"],
      ["თეიმურაზ ქერდიყოშვილი", dept6, "A0404 | temur.kerdikoshvili@lb.ge"],
      ["ვახტანგ ვახვახიშვილი", dept6, "B0654 | vakhtang.vakhvakhish@lb.ge"],
      ["შავლეგ შერვაშიძე", dept6, "B0493 | Shavleg.Shervashidze@lb.ge"],
      ["მამუკა ზაზაძე", dept6, "B1812 | Mamuka.Zazadze@lb.ge"],
      ["შალვა პუხლოვი", dept6, "B1280 | Shalva.Pukhlovi@lb.ge"],
      ["გიორგი მჟავანაძე", dept6, "B2257 | Gio.Mzhavanadze@lb.ge"],
      ["რომან ბერიძე", dept6, "B3118 | Roman.Beridze@lb.ge"],
      ["ილია თომაძე", dept6, "B3913 | Ilia.Tomadze@lb.ge"],
      ["გიორგი დავითაშვილი", dept6, "B4468 | Giorgi.Davitashvili@lb.ge"],
      ["გიორგი სესიტაშვილი", dept6, "B4545 | Giorgi.Sesitashvili@lb.ge"],
      ["გოგიტა გოგილაშვილი", dept6, "B4770 | Gogita.Gogilashvili@lb.ge"],
      ["ავთანდილ ქვლივიძე", dept6, "B5574 | Avtandil.Kvlividze@lb.ge"],
      ["კახა ტოგონიძე", dept6, "B7097 | Kakha.Togonidze@lb.ge"],
      ["გოჩა ბაჯელიძე", dept6, "B7993 | Gocha.Bajelidze@lb.ge"],
      ["თამაზი კვიჟინაძე", dept6, "B8769 | Tamazi.Kvizhinadze@lb.ge"],
      ["ლევანი გამრეკელაშვილი", dept6, "B9333 | Levani.Gamrekelashvili@lb.ge"],
      ["ლევანი მარკოზაშვილი", dept6, "B9538 | Levani.Markozashvili@lb.ge"],
      ["ნიკოლოზ მწითურიძე", dept6, "C0252 | Nikoloz.Mtsituridze@lb.ge"],
      ["ლევან ჟორჟოლიანი", dept6, "C0269 | Levan.Zhorzholiani@lb.ge"],
      ["თინათინ ჩაკვეტაძე", dept6, "C0360 | T.Chakvetadze@lb.ge"],
      ["დავითი ხუჯაძე", dept6, "C0694 | Daviti.Khujadze@lb.ge"],
      ["მანუჩარ პაპიძე", dept6, "C0915 | Manuchar.Papidze@lb.ge"],
      ["დავით დემეტრაძე", dept6, "C0999 | David.Demetradze@lb.ge"],
      ["გიორგი კოსტაროვი", dept6, "C1345 | Giorgi.Kostarovi@lb.ge"],
      ["დავით მელითაური", dept6, "C1535 | David.Melitauri@lb.ge"],
      ["ნუგზარ ფრანგულაშვილი", dept6, "C2548 | N.Prangulashvili@lb.ge"],
      ["დიმიტრი შიანოვ", dept6, "C4357 | Dimitri.Shianov@lb.ge"],
      ["დიმიტრი სტეფანოვი", dept6, "C4552 | Dimitri.Stepanovi@lb.ge"],
      ["დავით ლამაზოშვილი", dept6, "C4957 | Davit.Lamazoshvili@lb.ge"],
      ["ოთარ ფაჩულია", dept6, "C5371 | Otari.Pachulia@lb.ge"],
      ["ზურა პაკაცოშვილი", dept6, "C5394 | Zura.Pakatsoshvili@lb.ge"],
      ["ნიკა წერეთელი", dept6, "C6831 | Nika.Tsereteli@lb.ge"],
      ["სერგო ლალიაშვილი", dept6, "C7211 | Sergo.Laliashvili@lb.ge"],
      ["როინი სიმსივე", dept6, "C7347 | Roini.Simsive@lb.ge"],
      ["ბაჩანა ყაზარაშვილი", dept6, "C7839 | Bachana.Kazarashvili@lb.ge"],
      ["ბადრი კუბულაშვილი", dept6, "C8543 | Badri.Kubulashvili@lb.ge"],
      ["დავით ფარცახაშვილი", dept6, "C8558 | D.Partsakhashvili@lb.ge"],
      ["რევაზი გარსევნიშვილი", dept6, "C8658 | R.Garsevnishvili@lb.ge"],
      ["ნიკოლოზ გოძიაშვილი", dept6, "C8775 | Nikoloz.Godziashvili@lb.ge"],
      ["სოსო რომელაშვილი", dept6, "C9700 | Soso.Romelashvili@lb.ge"],
      ["ამირანი ფუტკარაძე", dept6, "D0073 | Amiran.Putkaradze@lb.ge"],
      ["შალვა ქევხიშვილი", dept6, "D0120 | Shalva.Kevkhishvili@lb.ge"],
      ["მიშა იმედაშვილი", dept6, "D0746 | Misha.Imedashvili@lb.ge"],

      // ავტომატიზაციის გუნდი
      ["დავით შაბურიშვილი", dept7, "B1868 | David.Shaburishvili@lb.ge"],
      ["გიორგი ნიავაძე", dept7, "B3972 | Giorgi.Niavadze@lb.ge"],
      ["მიხეილ გულიტაშვილი", dept7, "B9831 | Mikheil.Gulitashvili@lb.ge"],
      ["ნინო ჩაჩანიძე", dept7, "C4421 | N.Chachanidze@lb.ge"],
      ["ნინო ნიჟარაძე", dept7, "D0170 | Nino.Nizharadze@lb.ge"],
      ["დიანა რთველაძე", dept7, "D1144 | Diana.Rtveladze@lb.ge"]
    ];

    for (const staff of initialStaff) {
      await client.query(
        "INSERT INTO staff (name, department, staff_info) VALUES ($1, $2, $3) ON CONFLICT (name, staff_info) DO NOTHING",
        staff
      );
    }

    // One-time status seeding for existing data
    const statusSeedDone = await client.query("SELECT value FROM app_metadata WHERE key = 'status_seed_v2'");
    if (statusSeedDone.rows.length === 0) {
      const statusUpdates: [string, string, number, string | null][] = [
        ["ავთანდილ ყავრელიშვილი", "B9144 | Avtandil.Kavrelishvi@lb.ge", 0, "cert"],
        ["ავრაამი ბადალოვი", "C9606 | Avraami.Badalovi@lb.ge", 0, "rdp"],
        ["ანა არველაძე", "C1873 | Ana.Arvelაძე@lb.ge", 0, "rdp"],
        ["ანა თორია", "C9129 | Ana.Toria@lb.ge", 0, "rdp"],
        ["ანა ცანავა", "C6824 | Ana.Tsanava@lb.ge", 0, "rdp"],
        ["ანი გიორგაძე", "A0314 | Ani.Giorgadze@lb.ge", 1, null],
        ["ბაია დიდიშვილი", "D0450 | Baia.Didishvili@lb.ge", 0, "rdp"],
        ["ბაკურ სიხარულიძე", "C4691 | Bakur.Sikharulidze@lb.ge", 1, null],
        ["ბექა კაჭკაჭაშვილი", "C5829 | B.Katchkatchashvili@lb.ge", 1, null],
        ["ბექა ნასუაშვილი", "beka.nashuashvili@lb.ge", 1, null],
        ["გიორგი გელაშვილი", "C6749 | Giorgi.Gelashvili@lb.ge", 0, "rdp"],
        ["გიორგი დანელია", "C9021 | Giorgi.Danelia@lb.ge", 0, null],
        ["გიორგი კაკაშვილი", "B9280 | Giorgi.Kakashvili@lb.ge", 1, null],
        ["გიორგი მირზაშვილი", "C5974 | Giorgi.Mirzashvili@lb.ge", 0, "rdp"],
        ["გიორგი უჩანეიშვილი", "D0763 | Giorgi.Uchaneishvili@lb.ge", 0, "rdp"],
        ["გიორგი შაქარაშვილი", "C6047 | George.Shakarashvili@lb.ge", 0, "rdp"],
        ["გიორგი ცისკაძე", "C4564 | Giorgi.Tsiskadze@lb.ge", 1, null],
        ["გიორგი ძამაშვილი", "C0142 | Giorgi.Dzamashvili@lb.ge", 1, null],
        ["გიორგი ჭიღლაძე", "C5400 | Giorgi.Chighladze@lb.ge", 0, "rdp"],
        ["გოგა გაჩეჩილაძე", "C4562 | Goga.Gachechiladze@lb.ge", 1, null],
        ["გოდერძი ლომინეიშვილი", "goderdzi.lomineishvili@lb.ge", 0, null],
        ["გურამ აფხაზავა", "C8982 | Guram.Apkhazava@lb.ge", 0, "rdp"],
        ["დავით მამფორია", "C4693 | Davit.Mamporia@lb.ge", 0, null],
        ["დავითი გიორგაძე", "D0025 | Daviti.Giorgadze@lb.ge", 0, "rdp"],
        ["დავითი კაკაშვილი", "C3760 | Daviti.Kakashvili@lb.ge", 1, null],
        ["დავითი შადური", "C6822 | Daviti.Shaduri@lb.ge", 1, null],
        ["ელენე მჭედლიძე", "C0220 | Elene.Mchedlidze@lb.ge", 0, "rdp"],
        ["ელენე ორჯონიკიძე", "C1043 | Elene.Orjonikidze@lb.ge", 0, "rdp"],
        ["ელენე პეიტრიშვილი", "A1023 | Elene.Peitrishvili@lb.ge", 0, null],
        ["ვალენტინა ნათენაძე", "B2788 | Valentina.Natenadze@lb.ge", 0, "rdp"],
        ["ვანო თინაშვილი", "C1157 | Vano.Tinashvili@lb.ge", 0, null],
        ["ვასილი პაპიაშვილი", "C5332 | Vasil.Papiashvili@lb.ge", 1, null],
        ["ზეზვა მებაღიშვილი", "D1020 | Zezva.Mebagishvili@lb.ge", 0, "rdp"],
        ["ზვიად ჭანტურია", "C5688 | Zviad.Tchanturia@lb.ge", 1, null],
        ["ზურაბ წიკლაური", "C3860 | Zurab.Tsiklauri@lb.ge", 0, "rdp"],
        ["თამარ კავლელაშვილი", "B8707 | Tamar.Kavlelashvili@lb.ge", 1, null],
        ["თამარ როსტიაშვილი", "B3774 | Tamar.Rostiashvili@lb.ge", 0, "rdp"],
        ["თამარი დეკანოიძე", "A9719 | Tamar.Dekanoidze@lb.ge", 0, "rdp"],
        ["თამთა ტომარაძე", "A0962 | Tamta.Tomaradze@lb.ge", 1, null],
        ["თეიმურაზ მდინარაძე", "A0287 | Temuri.Mdinaradze@lb.ge", 0, "rdp"],
        ["თემური კორკოტაშვილი", "C3352 | Temuri.Korkotashvili@lb.ge", 0, "rdp"],
        ["თეონა კაპანაძე", "B5561 | T.Kapanadze@lb.ge", 0, "rdp"],
        ["თეონა ტუღუში", "A0603 | Teona.Tugushi@lb.ge", 0, "rdp"],
        ["თინათინ ყორღანაშვილი", "A8994 | Tinatin.Korghanashvili@lb.ge", 0, "rdp"],
        ["ირინა ვართანოვი", "C3400 | Irina.Vartanova@lb.ge", 0, "rdp"],
        ["ლევან მთივლიშვილი", "levan.mtivlishvili@lb.ge", 0, "burnt"],
        ["ლევანი ფილფანი", "C6823 | Levani.Pilpani@lb.ge", 0, "rdp"],
        ["ლელა ხითარიშვილი", "C5968 | Lela.Khitarishvili@lb.ge", 0, "rdp"],
        ["ლია კიკვაძე", "B5684 | Lika.Kikvadze@lb.ge", 0, "rdp"],
        ["მაია მოწონელიძე", "C1326 | Maia.Motsonelidze@lb.ge", 0, "rdp"],
        ["მარიამ შევარდნაძე", "C6443 | Mariam.Shevardnadze@lb.ge", 0, "rdp"],
        ["მარიამი კობახიძე", "C4886 | Mariami.Kobakhidze@lb.ge", 1, null],
        ["მარიკა მაკარიძე", "B2735 | Marika.Makaridze@lb.ge", 0, "other"],
        ["მარინა ტომოზოვა", "A5351 | Marina.Tomozova@lb.ge", 0, "burnt"],
        ["მეგი ახალკაცი", "C3417 | Megi.Akhalkatsi@lb.ge", 0, "rdp"],
        ["მედეა გეორბელიძე", "dea.georbelidze@lb.ge", 1, null],
        ["მზექალა არაბული", "C6344 | Mzekala.Arabuli@lb.ge", 0, "rdp"],
        ["მიხეილ სადრაძე", "C4955 | Mikheil.Sadradze@lb.ge", 1, null],
        ["ნათია მახათაძე", "C9347 | Natia.Makhatadze@lb.ge", 0, "rdp"],
        ["ნათია ჩხიკვაძე", "C3781 | n.chkhikvadze@lb.ge", 0, "rdp"],
        ["ნათია წიკლაური", "A0857 | Natia.Tsiklauri@lb.ge", 0, "rdp"],
        ["ნანა მამულია", "C8416 | Nana.Mamulia@lb.ge", 0, "other"],
        ["ნიკა კლდიაშვილი", "C4826 | Nika.Kldiashvili@lb.ge", 0, "rdp"],
        ["ნიკა რუხაძე", "C3209 | Nika.Rukhadze@lb.ge", 0, "rdp"],
        ["ნიკოლოზ მეზვრიშვილი", "B9830 | Nikoloz.Mezvrishvili@lb.ge", 1, null],
        ["ნინელი ქოჩქიანი", "D0728 | Nineli.Kochkiani@lb.ge", 0, "rdp"],
        ["ნინო დევდარიანი", "nino.devdariani@lb.ge", 1, null],
        ["ნინო პიტიურიშვილი", "A6411 | Nino.Pitiurishvili@lb.ge", 0, "other"],
        ["ნინო ფერაძე", "A9003 | Nino.Pheradze@lb.ge", 0, "rdp"],
        ["ნინო ღუნაშვილი", "A0621 | Nino.Gunashvili@lb.ge", 0, "other"],
        ["ნინო ცხვედიანი", "C5354 | Nino.Tskhvediani@lb.ge", 1, null],
        ["ნუგზარი ამონაშვილი", "C6817 | Nugzari.Amonashvili@lb.ge", 0, "rdp"],
        ["ნუგზარი როსტიაშვილი", "D0352 | Nugzari.Rostiashvili@lb.ge", 0, "rdp"],
        ["პაატა შარიქაძე", "A0324 | Paata.Sharikadze@lb.ge", 1, null],
        ["რაისა ბადალოვა", "C8983 | Raisa.Badalova@lb.ge", 0, null],
        ["რამაზ ბლუაშვილი", "C9104 | Ramaz.Bluashvili@lb.ge", 1, null],
        ["რუსუდანი ხაჟომია", "B0713 | Rusudan.Khazhomia@lb.ge", 0, "burnt"],
        ["საბა ჯაბაური", "C6074 | Saba.Jabauri@lb.ge", 1, null],
        ["სოფიკო თანიაშვილი", "B9092 | Sophiko.Taniashvili@lb.ge", 0, "rdp"],
        ["სოფიკო ჩიტაძე", "C9638 | Sopiko.Chitadze@lb.ge", 0, "rdp"],
        ["სოფიო გვენეტაძე", "D0026 | Sopio.Gvenetadze@lb.ge", 1, null],
        ["სოფიო კაპანაძე", "B0513 | Sopio.Kapanadze@lb.ge", 0, "burnt"],
        ["ფიქრია თეთრაშვილი", "C4790 | Pikria.Tetrashvili@lb.ge", 0, "rdp"],
        ["შალვა გიგაური", "C4392 | Shalva.Gigauri@lb.ge", 0, "rdp"],
        ["ხათუნა გიორგაძე", "B0714 | Khato.Giorgadze@lb.ge", 0, null],
        ["ხათუნა სურმანიძე", "C0659 | Khatuna.Surmanidze@lb.ge", 1, null],
        ["ხათუნა ჭიოკაძე", "C2521 | Khatuna.Tchiokadze@lb.ge", 1, null],
        ["ჯემალ მოწყობილი", "C7385 | Jemal.Motskobili@lb.ge", 0, "rdp"],
        
        // AI Team
        ["ალექსანდრე ბალიაშვილი", "D0592 | A.Baliashvili@lb.ge", 0, "rdp"],
        ["ალექსანდრე lომაძე", "B8897 | Aleksandre.Lomadze@lb.ge", 0, "rdp"],
        ["ანა ბურდულაძე", "C3507 | Ana.Burduladze@lb.ge", 0, null],
        ["ბაგრატი მჭედლიძე", "C5076 | Bagrati.Mchedlidze@lb.ge", 0, "rdp"],
        ["ელენე მელქაძე", "C3194 | Elene.Melkadze@lb.ge", 0, "rdp"],
        ["თენგიზი გაბიტაშვილი", "C3107 | Tengizi.Gabitashvili@lb.ge", 0, null],
        ["მარიამ ონიანი", "C5569 | Mariam.Oniani@lb.ge", 0, null],
        ["ნიკოლოზ მიქაბერიძე", "D0581 | Nikoloz.Mikaberidze@lb.ge", 0, null],
        ["საბა კობახიძე", "C9893 | Saba.Kobakhidze@lb.ge", 0, "rdp"],
        ["ქეთევან მონიავა", "C9229 | Ketevan.Moniava@lb.ge", 1, null]
      ];

      for (const [name, info, remote, prob] of statusUpdates) {
        await client.query(
          "UPDATE staff SET remote_access = $1, problem_type = $2 WHERE name = $3 AND staff_info = $4",
          [remote, prob, name, info]
        );
      }
      await client.query("INSERT INTO app_metadata (key, value) VALUES ('status_seed_v2', 'true') ON CONFLICT (key) DO UPDATE SET value = 'true'");
      await client.query("INSERT INTO app_metadata (key, value) VALUES ('last_global_update', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [new Date().toISOString()]);
    }
  } catch (err) {
    console.error("Seeding failed:", err);
    throw err;
  } finally {
    if (client) client.release();
  }
}

async function startServer() {
  await initDb();
  await seedInitialData();

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/staff", async (req, res) => {
    try {
      const staffRes = await pool.query("SELECT * FROM staff ORDER BY department ASC, name ASC");
      const metadataRes = await pool.query("SELECT value FROM app_metadata WHERE key = 'last_global_update'");
      res.json({ 
        staff: staffRes.rows, 
        lastUpdate: metadataRes.rows[0]?.value || null 
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  // Backup as JSON
  app.get("/api/download-db", async (req, res) => {
    try {
      const staffRes = await pool.query("SELECT * FROM staff");
      const metadataRes = await pool.query("SELECT * FROM app_metadata");
      const data = {
        staff: staffRes.rows,
        metadata: metadataRes.rows
      };
      res.setHeader('Content-disposition', 'attachment; filename=bcp_backup.json');
      res.setHeader('Content-type', 'application/json');
      res.send(JSON.stringify(data, null, 2));
    } catch (err) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Restore from JSON
  app.post("/api/restore-db", upload.single('database'), async (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const content = fs.readFileSync(req.file.path, 'utf8');
      const data = JSON.parse(content);
      fs.unlinkSync(req.file.path);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        if (data.staff) {
          for (const s of data.staff) {
            await client.query(`
              INSERT INTO staff (name, department, staff_info, remote_access, problem_type, other_details, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (name, staff_info) DO UPDATE SET
                remote_access = EXCLUDED.remote_access,
                problem_type = EXCLUDED.problem_type,
                other_details = EXCLUDED.other_details,
                updated_at = EXCLUDED.updated_at
            `, [s.name, s.department, s.staff_info, s.remote_access, s.problem_type, s.other_details, s.updated_at]);
          }
        }

        if (data.metadata) {
          for (const m of data.metadata) {
            await client.query(`
              INSERT INTO app_metadata (key, value) VALUES ($1, $2)
              ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
            `, [m.key, m.value]);
          }
        }

        await client.query('COMMIT');
        res.json({ success: true, message: "Data restored successfully" });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Restore failed:", err);
      res.status(500).json({ error: "Failed to restore data" });
    }
  });

  app.post("/api/staff/:id/status", async (req, res) => {
    const { id } = req.params;
    const { remote_access, problem_type, other_details } = req.body;
    const now = new Date().toISOString();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        UPDATE staff 
        SET remote_access = $1, 
            problem_type = $2, 
            other_details = $3, 
            updated_at = $4 
        WHERE id = $5
      `, [remote_access ? 1 : 0, problem_type || null, other_details || null, now, id]);

      await client.query(`
        INSERT INTO app_metadata (key, value) VALUES ('last_global_update', $1)
        ON CONFLICT (key) DO UPDATE SET value = $1
      `, [now]);

      await client.query('COMMIT');
      res.json({ success: true, lastUpdate: now });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: "Failed to update status" });
    } finally {
      client.release();
    }
  });

  app.post("/api/staff/bulk-verify", async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No IDs provided" });
    }

    const now = new Date().toISOString();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const id of ids) {
        await client.query(`
          UPDATE staff 
          SET remote_access = 0, 
              problem_type = 'verification_requested', 
              other_details = 'IT Support has fixed the issue. Please verify access.', 
              updated_at = $1 
          WHERE id = $2
        `, [now, id]);
      }

      await client.query(`
        INSERT INTO app_metadata (key, value) VALUES ('last_global_update', $1)
        ON CONFLICT (key) DO UPDATE SET value = $1
      `, [now]);

      await client.query('COMMIT');
      res.json({ success: true, lastUpdate: now });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: "Failed to update statuses" });
    } finally {
      client.release();
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
