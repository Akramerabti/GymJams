import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">{t('footer.aboutTitle')}</h3>
            <p className="text-gray-300">
              {t('footer.aboutDesc')}
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/orders" className="text-gray-300 hover:text-white">
                  {t('footer.orders')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white">
                  {t('footer.aboutUs')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white">
                  {t('footer.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">{t('footer.customerService')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/shipping" className="text-gray-300 hover:text-white">
                  {t('footer.shippingInfo')}
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-gray-300 hover:text-white">
                  {t('footer.returns')}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-300 hover:text-white">
                  {t('footer.faq')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info 
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">{t('footer.contactUs')}</h3>
            <ul className="space-y-2">
              <li className="text-gray-300">{t('footer.email')}: info@gymshop.com</li>
              <li className="text-gray-300">{t('footer.phone')}: (555) 123-4567</li>
              <li className="text-gray-300">
                {t('footer.address')}: 123 Fitness Street<br />
                Gym City, GC 12345
              </li>
            </ul>
          </div>*/}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            © {currentYear} GymShop. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;