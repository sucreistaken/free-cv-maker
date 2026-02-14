export function PrivacyPolicy() {
  return (
    <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Gizlilik Politikası</h3>
      <p className="text-xs text-gray-400">Son güncelleme: Şubat 2026</p>

      <p>
        NextCV ("biz", "bizim") olarak gizliliğinize önem veriyoruz. Bu politika, nextcv.net
        üzerinden sunulan hizmetlerimizi kullanırken kişisel verilerinizin nasıl işlendiğini
        açıklamaktadır.
      </p>

      <h4 className="font-semibold text-gray-800">1. Toplanan Veriler</h4>
      <p>
        NextCV tamamen tarayıcı tabanlı çalışır. CV verileriniz cihazınızın yerel depolama
        alanında (localStorage) saklanır ve sunucularımıza gönderilmez. Hiçbir kişisel veri
        sunucu tarafında depolanmaz.
      </p>

      <h4 className="font-semibold text-gray-800">2. Çerezler ve Analitik</h4>
      <p>
        Sitemizde kullanıcı deneyimini iyileştirmek amacıyla anonim analitik verileri
        toplanabilir. Bu veriler kişisel kimliğinizi tanımlamak için kullanılmaz.
      </p>

      <h4 className="font-semibold text-gray-800">3. Üçüncü Taraf Hizmetleri</h4>
      <p>
        Yazı tipleri için Google Fonts kullanılmaktadır. Google'ın gizlilik politikası için
        lütfen Google'ın ilgili sayfasını ziyaret edin.
      </p>

      <h4 className="font-semibold text-gray-800">4. Veri Güvenliği</h4>
      <p>
        Verileriniz yalnızca tarayıcınızda saklandığından, veri güvenliği cihazınızın
        güvenliğine bağlıdır. JSON dışa aktarma özelliğini kullanarak verilerinizi
        yedeklemenizi öneririz.
      </p>

      <h4 className="font-semibold text-gray-800">5. İletişim</h4>
      <p>
        Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz.
      </p>
    </div>
  );
}
