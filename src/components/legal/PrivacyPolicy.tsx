export function PrivacyPolicy() {
  return (
    <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Gizlilik Politikası</h3>
      <p className="text-xs text-gray-400">Son güncelleme: Eylül 2026</p>

      <p>
        NextCV ("biz", "bizim") olarak gizliliğinize önem veriyoruz. Bu politika, nextcv.kadiray.com
        üzerinden sunulan hizmetlerimizi kullanırken verilerinizin nasıl işlendiğini açıklamaktadır.
      </p>

      <h4 className="font-semibold text-gray-800">1. Toplanan Veriler</h4>
      <p>
        NextCV, oluşturduğunuz CV verilerini varsayılan olarak cihazınızın yerel depolama alanında
        (localStorage) tutar. Uygulamayı ilk açtığınızda karşınıza çıkan onay ekranında "Kabul Et"
        derseniz, oluşturduğunuz CV içeriği (ad, iletişim bilgileri, iş deneyimi, eğitim vb.) ve
        uygulamayı nasıl kullandığınıza dair bilgiler (örn. hangi şablonu seçtiğiniz, PDF içe/dışa
        aktarma, yapay zeka asistanı kullanımı) tarayıcınızda üretilen rastgele bir kimlikle
        birlikte sunucularımıza da gönderilir. PDF olarak içe aktardığınız dosyanın kendisi de
        saklanır. "Reddet" derseniz ya da onay ekranını hiç yanıtlamazsanız, hiçbir veri
        sunucularımıza gönderilmez.
      </p>

      <h4 className="font-semibold text-gray-800">2. Onayınızı Değiştirme</h4>
      <p>
        Verdiğiniz onayı dilediğiniz zaman sayfanın altındaki "Gizlilik Tercihi" bağlantısından
        değiştirebilirsiniz. Onayı geri çekmeniz, o ana kadar gönderilmiş verilerin sunucudan
        otomatik silinmesini sağlamaz; silinmesini istiyorsanız bizimle iletişime geçmeniz gerekir.
      </p>

      <h4 className="font-semibold text-gray-800">3. Barındırma ve Üçüncü Taraf Hizmetleri</h4>
      <p>
        Sunucu tarafı verileriniz Cloudflare altyapısında (D1 veritabanı ve R2 depolama) tutulur.
        Yazı tipleri için Google Fonts kullanılmaktadır. Bu hizmetlerin kendi gizlilik politikaları
        için ilgili sağlayıcının sayfasını ziyaret edebilirsiniz.
      </p>

      <h4 className="font-semibold text-gray-800">4. Veri Güvenliği</h4>
      <p>
        Sunucu tarafı verilere yalnızca yönetici paneli üzerinden, kimlik doğrulamalı erişimle
        ulaşılabilir. Verilerinizi ayrıca JSON olarak dışa aktarıp kendiniz yedekleyebilirsiniz.
      </p>

      <h4 className="font-semibold text-gray-800">5. İletişim</h4>
      <p>
        Gizlilik politikamız ya da verilerinizin silinmesi hakkında sorularınız için{' '}
        <a href="mailto:kadiraycareer@gmail.com" className="text-primary">kadiraycareer@gmail.com</a>{' '}
        adresinden bizimle iletişime geçebilirsiniz.
      </p>
    </div>
  );
}
