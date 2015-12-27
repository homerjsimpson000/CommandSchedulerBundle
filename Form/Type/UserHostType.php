<?php

namespace JMose\CommandSchedulerBundle\Form\Type;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

/**
 * Class UserHostType, used to edit/create UserHost Requirements
 *
 * @author  Daniel Fischer <dfischer000@gmail.com>
 */
class UserHostType extends AbstractType
{
    /**
     * {@inheritdoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add('id', 'hidden');

        $builder->add(
            'title', 'text', array(
                'label'    => 'rights.title',
                'required' => true
            )
        );

        $builder->add(
            'user', 'text', array(
                'label'    => 'rights.user',
                'required' => false
            )
        );

        $builder->add(
            'host', 'text', array(
                'label'    => 'rights.host',
                'required' => false
            )
        );

        $builder->add(
            'user_excluded', 'text', array(
                'label'    => 'rights.userExcluded',
                'required' => false
            )
        );

        $builder->add(
            'host_excluded', 'text', array(
                'label'    => 'rights.hostExcluded',
                'required' => false
            )
        );

        $builder->add(
            'info', 'textarea', array(
                'label'    => 'rights.info',
                'required' => false
            )
        );

        $builder->add(
            'save', 'submit', array(
                'label' => 'action.save',
            )
        );
    }

    /**
     * {@inheritdoc}
     */
    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(
            array(
                'data_class'         => 'JMose\CommandSchedulerBundle\Entity\UserHost',
                'wrapper_attr'       => 'default_wrapper',
                'translation_domain' => 'JMoseCommandScheduler'
            )
        );
    }
}
