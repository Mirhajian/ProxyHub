<div align="center">
  <img src="assets/banner.png" alt="ProxyHub Banner" width="100%">
</div>

# <img src="assets/icons/icon-globe.png" width="32" align="absmiddle"> کنترل پروکسی در دستان تو — ProxyHub
<div align="center" dir="rtl">

[![English](https://img.shields.io/badge/_English-README.md-blue?style=for-the-badge)](README.md) &nbsp; [![💰 حمایت از پروژه](https://img.shields.io/badge/💰_حمایت_از_پروژه-Donate-orange?style=for-the-badge)](#support) &nbsp; [![⭐ استار بده](https://img.shields.io/github/stars/Mirhajian/ProxyHub?style=for-the-badge&label=%E2%AD%90%20%D8%A7%D8%B3%D8%AA%D8%A7%D8%B1%20%D8%A8%D8%AF%D9%87&color=e08a68)](../../stargazers) &nbsp; [![لایسنس](https://img.shields.io/badge/لایسنس-غیرتجاری-c96b46?style=for-the-badge)](LICENSE) &nbsp; [![نسخه](https://img.shields.io/badge/نسخه-1.1.0-e08a68?style=for-the-badge)](#)

</div>

> The English version of this guide is available at: [README.md](README.md)


<div align="center">
  <img src="assets/divider.png" alt="" width="100%">
</div>

<div dir="rtl">

افزونه **ProxyHub** یک افزونه کروم است که به شما اجازه می‌دهد برای **هر سایت جداگانه** یک پروکسی
انتخاب کنید، به‌جای اینکه یک پروکسی در vpn ها را برای کل مرورگر روشن یا خاموش کنید. کافیست سایت را
انتخاب کنید، بگویید از کدام پروکسی عبور کند، و بقیه کارها — پیدا کردن دامنه‌های CDN مرتبط،
رفع تصاویر خراب، مدیریت قانون‌ها — را خود افزونه انجام می‌دهد.

نیازی به دانش فنی نیست: افزونه را نصب کنید، راهنمای تصویری  را دنبال کنید و کافی است.

> **تازه در نسخه‌ی ۱.۱.۰:** ProxyHub حالا روی فایرفاکس (نسخه دسکتاپ ۱۲۸ به بعد) هم اجرا
> می‌شود — به بخش [روش ج — فایرفاکس](#install) در ادامه نگاه کنید.

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

<p align="center">
  <img src="assets/screenshots/options.jpg" alt="صفحه مدیریت قانون‌های ProxyHub — لیست کامل قوانین مسیردهی" width="90%">
  <br><sub>مدیریت همه‌ی قانون‌ها و پروفایل‌های پروکسی از صفحه‌ی کامل تنظیمات.</sub>
</p>

<table dir="rtl">
<tr>
<td width="50%" align="center" valign="top">
<img src="assets/screenshots/toolbar.png" alt="آیکون نوار ابزار ProxyHub — حالت فعال و غیرفعال" width="85%">
<br><sub>آیکون نوار ابزار با یک نگاه نشان می‌دهد که ProxyHub در حال مسیردهی سایت فعلی هست یا نه.</sub>
</td>
<td width="50%" align="center" valign="top">
<img src="assets/screenshots/popup.png" alt="پاپ‌آپ ProxyHub — انتخاب پروکسی برای سایت فعلی" width="70%">
<br><sub>انتخاب پروکسی برای تب فعلی، مستقیم از پاپ‌آپ نوار ابزار.</sub>
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

### روش الف — فروشگاه وب کروم / افزونه‌های فایرفاکس
*(به‌زودی — این بخش پس از انتشار در فروشگاه‌ها، با لینک‌های مربوطه به‌روزرسانی می‌شود.)*

### روش ب — Chrome، Edge، Brave، Arc، Opera (هر مرورگر کرومیومی)

۱. به صفحه‌ی [**Releases**](../../releases) بروید و فایل `proxyhub-chrome-X.Y.Z.zip` را از
   آخرین ریلیز دانلود و از حالت فشرده خارج کنید.

۲. در مرورگر خود آدرس `chrome://extensions` را باز کنید.
برای Brave `brave://extensions` و به ترتیب برای Arc و Edge هم: `arc://extensions` و `edge://extensions` به همین صورت است.

۳. گزینه **Developer mode** را در بالا-سمت‌راست صفحه روشن کنید.

۴. روی **Load unpacked** بزنید و پوشه‌ای که از حالت فشرده خارج کرده بودید را انتخاب کنید.

۵. آیکن افزونه را به نوار ابزار پین کنید تا همیشه با یک کلیک در دسترس باشد.

همین! همان بار اول، یک راهنمای خوش‌آمدگویی به‌صورت خودکار باز می‌شود و همراه با تصویر همه‌چیز
را توضیح می‌دهد.

### روش ج — فایرفاکس (دسکتاپ ۱۲۸ به بعد)

۱. به صفحه‌ی [**Releases**](../../releases) بروید و فایل `proxyhub-firefox-X.Y.Z.zip` را از
   آخرین ریلیز دانلود و از حالت فشرده خارج کنید. (این نسخه از قبل manifest درستِ فایرفاکس رو
   داره — نیازی به تغییرنام یا ویرایش هیچ فایلی نیست.)

۲. آدرس `about:debugging#/runtime/this-firefox` را در فایرفاکس باز کنید.

۳. روی **Load Temporary Add-on…** بزنید و فایل `manifest.json` داخل پوشه‌ی خارج‌شده از حالت
   فشرده را انتخاب کنید.

۴. آیکن افزونه را به نوار ابزار پین کنید.

دو نکته‌ی مخصوص فایرفاکس:

- **هر بار که فایرفاکس کاملاً ری‌استارت بشه، افزونه‌ی موقت حذف می‌شه** — باید مرحله‌ی ۳ رو
  دوباره انجام بدید (پروفایل‌ها و قانون‌هاتون از بین نمی‌ره، چون توی حافظه‌ی خودِ افزونه داخل
  مرورگر ذخیره شده؛ فقط وضعیت «این افزونه بارگذاری شده یا نه» ریست می‌شه). این یک محدودیت
  خودِ فایرفاکس برای افزونه‌های امضانشده‌ست، نه چیزی که ProxyHub بتونه تغییرش بده. برای نصب
  دائمی به‌جاش:
  - از طریق [addons.mozilla.org](https://addons.mozilla.org) توسط موزیلا امضا بگیرید — یا
    به‌صورت عمومی منتشرش کنید یا به‌عنوان یک `.xpi` امضاشده‌ی «self-distribution» رایگان که
    فقط خودتون نصبش می‌کنید و می‌مونه. (اگه این کار رو کردید، اول فایل
    `manifest.firefox.json` رو باز کنید و `browser_specific_settings.gecko.id` رو به یه
    شناسه‌ی متعلق به خودتون تغییر بدید.)
  - یا فقط روی نسخه‌های Developer Edition / Nightly / ESR فایرفاکس، مقدار
    `xpinstall.signatures.required` رو توی `about:config` روی `false` بذارید و `.xpi` رو
    مستقیم نصب کنید — این روش روی نسخه‌ی عادی/release فایرفاکس در دسترس نیست.
  - برای توسعه‌ی فعال، ابزار رسمی موزیلا [`web-ext run`](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/)
    خودش هر بار افزونه‌ی موقت رو دوباره بارگذاری می‌کنه و بیشتر خستگیِ این رفتار فایرفاکس رو
    موقع توسعه‌ی کد از بین می‌بره.
- **نحوه‌ی کار پروکسی در پشت صحنه فرق دارد.** کروم اجازه می‌دهد ProxyHub یک اسکریپت PAC
  به آن بدهد؛ فایرفاکس این کار را برای افزونه‌های عادی اجازه نمی‌دهد، پس روی فایرفاکس
  ProxyHub به‌جای آن، برای هر درخواست به‌صورت لحظه‌ای و با همان قانون‌ها تصمیم می‌گیرد.
  رفتار نهایی یکسان است — این فقط تفاوت فنی زیرساخت است.

### ساخت از سورس / برای توسعه‌دهنده‌ها

داخل ریپازیتوری همیشه هم `manifest.json` (کروم) و هم `manifest.firefox.json` (فایرفاکس)
کنار هم هستن — فقط زمانی لازمه دستی دستکاریشون کنید که دارید یه تغییر هنوز‌منتشرنشده رو تست
می‌کنید: برای تست روی فایرفاکس، `manifest.firefox.json` رو موقتاً به `manifest.json`
تغییرنام بدید (بعد از حذف/تغییرنام فایل قبلی) و بعد به‌صورت unpacked بارگذاریش کنید. هر بار
که یک تگ به شکل `vX.Y.Z` پوش بشه، به‌صورت خودکار هر دو زیپ آماده
(`proxyhub-chrome-X.Y.Z.zip` و `proxyhub-firefox-X.Y.Z.zip`) از طریق
[`.github/workflows/release.yml`](.github/workflows/release.yml) ساخته و به همون Release
اضافه می‌شن — همون چیزی که روش ب و روش ج بالا دانلودشون می‌کنن، پس اکثر افراد اصلاً نیازی به
انجام این کار به‌صورت دستی ندارن.

<div align="center">
  <img src="assets/divider.png" alt="" width="100%">
</div>

<a id="howto"></a>
## <img src="assets/icons/icon-guide.png" width="26" align="absmiddle"> نحوه استفاده

۱. **یک پروکسی اضافه کنید** — از صفحه‌ی تنظیمات افزونه، بخش پروفایل‌های پروکسی را باز کنید و آدرس سرور، پورت و در صورت نیاز نام‌کاربری/رمز عبور را وارد کنید. این کار فقط یک‌بار برای هر پروکسی لازم است.

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
