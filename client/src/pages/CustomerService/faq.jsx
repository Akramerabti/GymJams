import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

// Export the FAQ component to be used in Contact.jsx
export const FAQSection = ({
  searchTerm = '',
  setSearchTerm,
  activeTab,
  setActiveTab,
  faqScrollRef
}) => {
  // State for categories and current category tab
  const [faqCategoryTab, setFaqCategoryTab] = useState('general');
  
  // FAQ items data - same as in original component
  const faqItems = {
    general: [
      {
        question: 'What is GymTonic?',
        answer: 'GymTonic is an online fitness platform that offers premium gym equipment, personalized coaching services, and fitness resources to help you achieve your fitness goals.'
      },
      {
        question: 'How do I create an account?',
        answer: 'To create an account, click on the "Login" button in the top-right corner of the page, then select "Register". Fill in your details to set up your account.'
      },
      {
        question: 'Is my personal information secure?',
        answer: 'Yes, we take data security seriously. We use industry-standard encryption and follow best practices to ensure your personal information is protected. You can review our privacy policy for more details.'
      },
      {
        question: 'How can I contact customer support?',
        answer: 'You can reach our customer support team through our Contact page, by email at support@gymtonic.ca, or by phone at (555) 123-4567 during business hours.'
      },
      {
        question: 'Do you have a physical store?',
        answer: 'Currently, GymTonic operates exclusively online. However, we offer virtual consultations for equipment and coaching services.'
      }
    ],
    products: [      {
        question: 'What types of products do you sell?',
        answer: 'We offer a wide range of fitness equipment including clothes, machines, accessories, and cardio equipment. All our products are carefully selected for quality and performance.'
      },
      {
        question: 'How do I know which product is right for me?',
        answer: 'Our product descriptions include detailed specifications and recommended use cases. If you need personalized guidance, consider booking a consultation with one of our fitness experts.'
      },
      {
        question: 'Do you offer product warranties?',
        answer: 'Yes, all our products come with manufacturer warranties. The warranty period varies by product and is listed on each product page.'
      },
      {
        question: 'Can I purchase replacement parts?',
        answer: 'Yes, replacement parts are available for most of our equipment. Contact our customer service team with your product model and the parts you need.'
      }
    ],
    coaching: [
      {
        question: 'How does the coaching service work?',
        answer: 'Our coaching service connects you with certified fitness professionals who provide personalized guidance. After subscribing, you\'ll complete a questionnaire about your goals and preferences, then be matched with a coach who will create a custom plan for you.'
      },
      {
        question: 'What qualifications do your coaches have?',
        answer: 'All our coaches are certified fitness professionals with relevant qualifications. Many hold degrees in exercise science, nutrition, or related fields, and all have practical experience working with diverse clients.'
      },
      {
        question: 'How often will I interact with my coach?',
        answer: 'This depends on your subscription plan. Basic plans include weekly check-ins, while premium and elite plans offer more frequent communication, including direct messaging and video calls.'
      },
      {
        question: 'Can I change my coach if we\'re not a good fit?',
        answer: 'Yes, you can request a coach change if you feel your current coach isn\'t meeting your needs. We\'ll work with you to find a better match.'
      },
      {
        question: 'How do I become a coach on GymTonic?',
        answer: 'We\'re always looking for qualified coaches to join our platform. You can apply through our Careers page and complete the coach application process.'
      }
    ],
    orders: [
      {
        question: 'How do I place an order?',
        answer: 'Browse our products, add items to your cart, and proceed to checkout. You\'ll need to create an account or log in, then provide shipping and payment information to complete your order.'
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards, PayPal, and Apple Pay. Payment information is securely processed through our payment partners.'
      },
      {
        question: 'How can I check my order status?',
        answer: 'Log in to your account and go to the Orders section to view the status of your current and past orders.'
      },
      {
        question: 'Can I modify or cancel my order?',
        answer: 'You can modify or cancel your order within 24 hours of placing it, provided it hasn\'t shipped yet. Contact our customer service team for assistance.'
      }
    ],
    returns: [
      {
        question: 'What is your return policy?',
        answer: 'We offer a 30-day return policy for most products. Items must be in original condition and packaging. Custom or personalized products may have different return terms.'
      },
      {
        question: 'How do I initiate a return?',
        answer: 'Log in to your account, go to your Orders, select the item you wish to return, and follow the return instructions. You\'ll receive a return shipping label and detailed instructions.'
      },
      {
        question: 'Who pays for return shipping?',
        answer: 'For returns due to defects or errors on our part, we\'ll cover the shipping costs. For other returns, shipping fees may be the customer\'s responsibility.'
      },
      {
        question: 'How long do refunds take to process?',
        answer: 'Once we receive your return, it takes 3-5 business days to process. Refunds typically appear in your account within 5-10 business days, depending on your payment method and financial institution.'
      }
    ],
    membership: [
      {
        question: 'What is the points system?',
        answer: 'Our points system rewards you for shopping and engaging with our platform. You earn points on purchases, completing fitness challenges, and participating in community activities. These points can be redeemed for discounts on future purchases.'
      },
      {
        question: 'How do I earn points?',
        answer: 'You earn points through purchases (1 point per dollar spent), completing your profile (100 points), subscribing to our newsletter (50 points), and participating in challenges (points vary by challenge).'
      },
      {
        question: 'How do I redeem points?',
        answer: 'During checkout, you\'ll see an option to apply points towards your purchase. Points can be redeemed in increments of 500, with each 500 points worth $5 off your order.'
      },
      {
        question: 'Do points expire?',
        answer: 'Points expire 12 months after they are earned if there is no account activity. Keeping your account active by making purchases or engaging with the platform will prevent points from expiring.'
      }
    ],
    careers: [
      {
        question: 'What positions are available at GymTonic?',
        answer: 'We regularly hire for roles including Fitness Coaches, Customer Support Specialists, Product Managers, Taskforce Members, and more. Visit our Careers page to see current openings.'
      },
      {
        question: 'How do I apply for a job?',
        answer: 'To apply for a position, visit our Application page, select the appropriate application type, and submit your information along with any required documents.'
      },
      {
        question: 'What is the Taskforce team?',
        answer: 'The Taskforce team manages our product catalog, inventory, customer support cases, and general platform operations. Taskforce members have specialized access to our backend systems to ensure everything runs smoothly.'
      },
      {
        question: 'Do you offer remote work opportunities?',
        answer: 'Yes, many of our positions are remote-friendly, particularly for coaching and customer support roles. Specific location requirements are listed in each job description.'
      },
      {
        question: 'What qualities do you look for in team members?',
        answer: 'We value passion for fitness, customer-focused mindset, problem-solving abilities, and excellent communication skills. Specific qualifications vary by role, but these core qualities are important across all positions.'
      }
    ]
  };

  const categories = [
    'general',
    'products',
    'coaching',
    'orders',
    'returns',
    'membership',
    'careers'
  ];

  // Filter FAQ items based on search term
  const filteredFAQs = searchTerm === '' 
    ? faqItems 
    : Object.keys(faqItems).reduce((acc, category) => {
        acc[category] = faqItems[category].filter(item => 
          item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
          item.answer.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return acc;
      }, {});

  // Count total matches for FAQ search
  const totalFaqMatches = Object.values(filteredFAQs).reduce(
    (sum, categoryItems) => sum + categoryItems.length, 
    0
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search for answers..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-500 mt-2">
            Found {totalFaqMatches} {totalFaqMatches === 1 ? 'result' : 'results'} for "{searchTerm}"
          </p>
        )}
      </div>
      
      <Tabs value={faqCategoryTab} onValueChange={setFaqCategoryTab}>
        <ScrollArea className="w-full mb-6">
          <TabsList className="w-full justify-start">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="capitalize"
                disabled={filteredFAQs[category]?.length === 0}
              >
                {category}
                {searchTerm && filteredFAQs[category]?.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {filteredFAQs[category].length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        <ScrollArea className="h-[60vh]" ref={faqScrollRef}>
          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              {filteredFAQs[category]?.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFAQs[category].map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No FAQ items found for this category.</p>
                </div>
              )}
              
              {/* Add application link for relevant categories */}
              {(category === 'coaching' || category === 'careers') && (
                <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">
                    {category === 'coaching' ? 'Interested in becoming a coach?' : 'Want to join our team?'}
                  </h3>
                  <p className="mb-4 text-gray-600">
                    {category === 'coaching' 
                      ? 'We\'re always looking for qualified fitness professionals to join our coaching team.' 
                      : 'Check out our current openings and submit your application today.'}
                  </p>
                  <Button 
                    className="flex items-center gap-2"
                    onClick={() => setActiveTab('application')}
                  >
                    Apply Now
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>
      
      <div className="mt-12 text-center">
        <h2 className="text-xl font-semibold mb-4">Still have questions?</h2>
        <p className="text-gray-600 mb-6">
          If you couldn't find the answer to your question, feel free to reach out to our support team.
        </p>
        <Button onClick={() => setActiveTab('contact')}>
          Contact Us
        </Button>
      </div>
    </div>
  );
};

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const faqScrollRef = React.useRef(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">Frequently Asked Questions</h1>
          <p className="text-gray-600">
            Find answers to common questions about our products, services, and policies.
          </p>
        </div>
        
        <FAQSection
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            // For standalone page navigation
            if (tab === 'contact') window.location.href = '/contact';
            if (tab === 'application') window.location.href = '/application';
          }}
          faqScrollRef={faqScrollRef}
        />
      </div>
    </div>
  );
};

export default FAQ;