<div align="center">
  <img src="assets/banner.png" alt="ProxyHub Banner" width="100%">
</div>

# <img src="assets/icons/icon-globe.png" width="32" align="absmiddle"> ProxyHub — کنترل پروکسی در دستان تو
<div align="center" dir="rtl">

[![English](https://img.shields.io/badge/_English-README.md-blue?style=for-the-badge)](README.md) &nbsp; [![💰 حمایت از پروژه](https://img.shields.io/badge/💰_حمایت_از_پروژه-Donate-orange?style=for-the-badge)](#support) &nbsp; [![⭐ استار بده](https://img.shields.io/github/stars/Mirhajian/ProxyHub?style=for-the-badge&label=%E2%AD%90%20%D8%A7%D8%B3%D8%AA%D8%A7%D8%B1%20%D8%A8%D8%AF%D9%87&color=e08a68)](../../stargazers) &nbsp; [![لایسنس](https://img.shields.io/badge/لایسنس-غیرتجاری-c96b46?style=for-the-badge)](LICENSE) &nbsp; [![نسخه](https://img.shields.io/badge/نسخه-1.0.0-e08a68?style=for-the-badge)](#)

</div>

> The English version of this guide is available at: [README.md](README.md)

<div align="center">
  <img src="assets/divider.png" alt="" width="100%">
</div>

<div dir="rtl">

**ProxyHub**  افزونه کروم است که به شما اجازه می‌دهد برای **هر سایت جداگانه** یک پروکسی
انتخاب کنید، به‌جای اینکه یک پروکسی در vpn ها را برای کل مرورگر روشن یا خاموش کنید. کافیست سایت را
انتخاب کنید، بگویید از کدام پروکسی عبور کند، و بقیه کارها — پیدا کردن دامنه‌های CDN مرتبط،
رفع تصاویر خراب، مدیریت قانون‌ها — را خود افزونه انجام می‌دهد.

نیازی به دانش فنی نیست: افزونه را نصب کنید، راهنمای تصویری  را دنبال کنید و کافی است.

### <img src="assets/icons/icon-toc.png" width="24" align="absmiddle"> فهرست مطالب

- [اسکرین‌شات‌ها](#screenshots)
- [قابلیت‌ها](#features)
- [نصب](#install)
- [نحوه استفاده](#howto)
- [نکات مهم](#goodtoknow)
- [حمایت از پروژه](#support)

<div align="center">
  <img src="assets/divider.png" alt="" width="100%">
</div>

<a id="screenshots"></a>
## اسکرین‌شات‌ها

<table dir="rtl">
<tr>
<td width="28%" valign="top">

<img src="assets/screenshots/toolbar.png" alt="آیکون نوار ابزار ProxyHub — حالت فعال و غیرفعال" width="100%">
<sub>آیکون نوار ابزار با یک نگاه نشان می‌دهد که ProxyHub در حال مسیردهی سایت فعلی هست یا نه.</sub>

<br><br>

<img src="assets/screenshots/popup.png" alt="پاپ‌آپ ProxyHub — انتخاب پروکسی برای سایت فعلی" width="100%">
<sub>انتخاب پروکسی برای تب فعلی، مستقیم از پاپ‌آپ نوار ابزار.</sub>

</td>
<td width="72%" valign="top">

<img src="assets/screenshots/options.jpg" alt="صفحه مدیریت قانون‌های ProxyHub — لیست کامل قوانین مسیردهی" width="100%">
<sub>مدیریت همه‌ی قانون‌ها و پروفایل‌های پروکسی از صفحه‌ی کامل تنظیمات.</sub>

</td>
</tr>
</table>

<div align="center">
  <img src="assets/divider.png" alt="" width="100%">
</div>

<a id="features"></a>
## <img src="assets/icons/icon-features.png" width="26" align="absmiddle"> قابلیت‌ها

- **یک پروکسی برای هر سایت** — یوتیوب از یک پروکسی، سایتی دیگر از پروکسی دیگر، و بقیه
  سایت‌ها به‌طور عادی بارگذاری می‌شوند. دیگر نیازی به روشن/خاموش کردن یک پروکسی سراسری نیست.
- **پیشنهاد هوشمند دامنه‌های مرتبط** — سایت‌های بزرگ تصاویر و ویدیو را از دامنه‌های CDN
  جداگانه بارگذاری می‌کنند. وقتی سایتی را اضافه کنید که ProxyHub می‌شناسد، پیشنهاد می‌دهد
  آن دامنه‌های مرتبط را هم اضافه کنید تا هیچ‌چیز ناکامل نماند.
- **رفع خودکار صفحات خراب** — اگر چیزی در صفحه به‌خاطر یک دامنه پوشش‌داده‌نشده بارگذاری
  نشود، یک بنر کوچک ظاهر می‌شود و پیشنهاد می‌دهد Rules لازم اضافه و صفحه رفرش شود.
- **آیکن های نوار ابزار** — با یک نگاه به نوار ابزار می‌فهمید تب فعلی پروکسی است،
  مستقیم است یا مسیردهی خاموش است — بدون نیاز به باز کردن پنجره افزونه.
- **مدیریت هزاران قانون** — جستجو، فیلتر، و ایمپورت/اکسپورت دسته‌ای برای کسانی که سایت‌های
  زیادی مدیریت می‌کنند.
- **صندوق رمزنگاری‌شده اختیاری** — اگر پروکسی شما نام‌کاربری/رمز عبور نیاز دارد، می‌توانید
  آن را پشت یک رمز اصلی قفل کنید، به‌جای ذخیره‌شدن به‌صورت متن ساده.
- **پشتیبانی از تم روشن و تیره.**

<div align="center">
  <img src="assets/divider.png" alt="" width="100%">
</div>

<a id="install"></a>
## <img src="assets/icons/icon-install.png" width="26" align="absmiddle"> نصب

### روش الف — فروشگاه وب کروم
*(به‌زودی — این بخش پس از انتشار در فروشگاه، با لینک مربوطه به‌روزرسانی می‌شود.)*

### روش ب — نصب دستی (همین حالا کار می‌کند، روی هر مرورگر کرومیومی: Chrome، Edge، Brave، Arc، Opera)

۱. این ریپازیتوری را دانلود کنید — روی دکمه سبز رنگ **Code** در بالای صفحه بزنید،
   **Download ZIP**، سپس فایل را از حالت فشرده خارج کنید (یا در صورت آشنایی با Git، آن را
   `clone` کنید).

۲. در مرورگر خود آدرس `chrome://extensions` را باز کنید.
برای Brave `brave://extensions` و به ترتیب برای Arc و Edge هم: `arc://extensions` و `edge://extensions` به همین صورت است.

۳. گزینه **Developer mode** را در بالا-سمت‌راست صفحه روشن کنید.

۴. روی **Load unpacked** بزنید و پوشه `ProxyHub` که از حالت فشرده خارج کرده بودید را انتخاب
   کنید.

۵. آیکن افزونه را به نوار ابزار پین کنید تا همیشه با یک کلیک در دسترس باشد.

همین! همان بار اول، یک راهنمای خوش‌آمدگویی به‌صورت خودکار باز می‌شود و همراه با تصویر همه‌چیز
را توضیح می‌دهد.

<div align="center">
  <img src="assets/divider.png" alt="" width="100%">
</div>

<a id="howto"></a>
## <img src="assets/icons/icon-guide.png" width="26" align="absmiddle"> نحوه استفاده

۱. **یک پروکسی اضافه کنید** — صفحه *تنظیمات* افزونه را باز کنید → *پروفایل‌های پروکسی* →
   آدرس سرور، پورت و در صورت نیاز، نام‌کاربری/رمز عبور پروکسی خود را وارد کنید. این کار فقط
   یک‌بار برای هر پروکسی لازم است.

۲. **یک سایت را انتخاب کنید** — روی آیکن ProxyHub در هر سایتی کلیک کنید، مشخص کنید از کدام
   پروفایل پروکسی عبور کند، سپس صفحه را رفرش کنید. برای سایت‌هایی که نمی‌خواهید پروکسی شوند،
   حالت *مستقیم* را نگه دارید.

۳. **آیکن را بخوانید** — آیکن نوار ابزار همیشه وضعیت تب فعلی را با یک نگاه نشان می‌دهد:
   - <img src="assets/icons/status-proxied.png" width="14" align="absmiddle"> **پروکسی فعال** — این تب از یک پروکسی عبور می‌کند
   - <img src="assets/icons/status-direct.png" width="14" align="absmiddle"> **مستقیم** — بدون قانون، به‌صورت عادی بارگذاری می‌شود
   - <img src="assets/icons/status-off.png" width="14" align="absmiddle"> **غیرفعال** — مسیردهی برای همه‌جا متوقف است

۴. **بگذارید افزونه کمکتان کند** — اگر سایتی به دامنه‌های CDN بیشتری نیاز دارد، یا صفحه‌ای
   تصویر/اسکریپت خراب دارد، ProxyHub یک راه‌حل یک‌کلیکی پیشنهاد می‌دهد.

<div align="center">
  <img src="assets/divider.png" alt="" width="100%">
</div>

<a id="goodtoknow"></a>
## <img src="assets/icons/icon-warning.png" width="26" align="absmiddle"> نکات مهم

- یک دامنه در هر لحظه فقط از یک مسیر عبور می‌کند — اگر دو سایت مختلف که اضافه کرده‌اید هر دو
  از یک دامنه CDN عمومی مشترک استفاده کنند، آن دامنه از قانونی پیروی می‌کند که زودتر ساخته
  شده است.
- سافاری پشتیبانی نمی‌شود: اپل اصلاً اجازه نمی‌دهد افزونه‌های مرورگر تنظیمات پروکسی را کنترل
  کنند، بنابراین این محدودیت خود پلتفرم است، نه چیزی که بعداً بتوان اضافه کرد.
- **لایسنس**: استفاده و تغییر کد برای مصارف شخصی رایگان است. استفاده‌ی تجاری بدون توافق‌نامه‌ی
  کتبی جداگانه با نویسنده مجاز نیست — جزئیات در فایل [LICENSE](LICENSE).

<div align="center">
  <img src="assets/divider.png" alt="" width="100%">
</div>

<a id="support"></a>
## <img src="assets/icons/icon-heart.png" width="26" align="absmiddle"> حمایت از پروژه

<div align="center">

اگر ProxyHub برایتان مفید بوده، حمایت شما در ادامه توسعه‌  ارزشمند خواهد بود.
</div>

<br>

<div align="center">

| شبکه | آدرس |
|:---|:---|
| ![TON](https://img.shields.io/badge/TON-0088CC?style=flat-square&logo=ton&logoColor=white) | `UQDPxrimgBU6Mil0dhDn0Fc303RLRXKr9hGGDu7bTEBdGGqs` |
| ![TRC20](https://img.shields.io/badge/TRC20%20(ترون)-FF060A?style=flat-square&logo=tron&logoColor=white) | `TXix7uf6JPUKvWeUbA4A7wmQLVKnDbLRQU` |
| ![ETH](https://img.shields.io/badge/ERC20%20(اتریوم)-3C3C3D?style=flat-square&logo=ethereum&logoColor=white) | `0x1FC907d3396460f1Cd94E3BC48564b1b46b70026` |

</div>

<br>

<div align="center">

> از توجه و حمایت شما سپاسمندم <img src="assets/icons/icon-heart.png" width="16" align="absmiddle">

</div>

</div>
