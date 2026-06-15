// Jalankan API secara LOKAL: node server.local.js  (butuh .env berisi kredensial DB)
import app from "./api/_lib/app.js";
import { assertDbConnection } from "./api/_lib/db.js";
const PORT = process.env.PORT || 4000;
assertDbConnection()
  .then(() => app.listen(PORT, () => console.log(`✅ API lokal di http://localhost:${PORT}`)))
  .catch((e) => { console.error("❌ Gagal konek MySQL:", e.message); process.exit(1); });
