import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("bcp.db");

// Initialize database
db.exec(`

  CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    department TEXT,
    staff_info TEXT,
    remote_access INTEGER DEFAULT 0,
    problem_type TEXT,
    other_details TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

// Seed initial data
const insert = db.prepare("INSERT OR IGNORE INTO staff (name, department, staff_info) VALUES (?, ?, ?)");

const dept1 = "საბანკო სერვისების განვითარების დეპარტამენტი";
const dept2 = "ციფრული ბანკინგის დეპარტამენტი";
const dept3 = "ბიზნეს ანალიტიკისა და რეპორტინგის დეპარტამენტი (AI გუნდი)";

const initialStaff = [
  // საბანკო სერვისების განვითარების დეპარტამენტი
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
  ["ალექსანდრე ბალიაშვილი", dept3, "D0592 | A.Baliashvili@lb.ge"]
];

// We use a transaction to ensure all staff are inserted correctly
const checkExists = db.prepare("SELECT id FROM staff WHERE name = ? AND staff_info = ?");
const seedTransaction = db.transaction(() => {
  for (const staff of initialStaff) {
    const exists = checkExists.get(staff[0], staff[2]);
    if (!exists) {
      insert.run(staff[0], staff[1], staff[2]);
    }
  }
});

seedTransaction();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/staff", (req, res) => {
    const staff = db.prepare("SELECT * FROM staff ORDER BY department ASC, name ASC").all();
    const lastUpdate = db.prepare("SELECT value FROM app_metadata WHERE key = 'last_global_update'").get() as { value: string } | undefined;
    res.json({ staff, lastUpdate: lastUpdate?.value || null });
  });

  app.post("/api/staff/:id/status", (req, res) => {
    const { id } = req.params;
    const { remote_access, problem_type, other_details } = req.body;

    const now = new Date().toISOString();

    const updateStaff = db.prepare(`
      UPDATE staff 
      SET remote_access = ?, 
          problem_type = ?, 
          other_details = ?, 
          updated_at = ? 
      WHERE id = ?
    `);

    const updateMetadata = db.prepare(`
      INSERT OR REPLACE INTO app_metadata (key, value) VALUES ('last_global_update', ?)
    `);

    const transaction = db.transaction(() => {
      updateStaff.run(remote_access ? 1 : 0, problem_type || null, other_details || null, now, id);
      updateMetadata.run(now);
    });

    try {
      transaction();
      res.json({ success: true, lastUpdate: now });
    } catch (err) {
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  app.post("/api/staff/bulk-verify", (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No IDs provided" });
    }

    const now = new Date().toISOString();
    
    // We'll set problem_type to 'verification_requested' or similar
    // Actually, the user said "change status so employee can verify". 
    // I'll set remote_access to 0 and problem_type to 'verification_requested'
    const updateStaff = db.prepare(`
      UPDATE staff 
      SET remote_access = 0, 
          problem_type = 'verification_requested', 
          other_details = 'IT Support has fixed the issue. Please verify access.', 
          updated_at = ? 
      WHERE id = ?
    `);

    const updateMetadata = db.prepare(`
      INSERT OR REPLACE INTO app_metadata (key, value) VALUES ('last_global_update', ?)
    `);

    const transaction = db.transaction(() => {
      for (const id of ids) {
        updateStaff.run(now, id);
      }
      updateMetadata.run(now);
    });

    try {
      transaction();
      res.json({ success: true, lastUpdate: now });
    } catch (err) {
      res.status(500).json({ error: "Failed to update statuses" });
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
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
