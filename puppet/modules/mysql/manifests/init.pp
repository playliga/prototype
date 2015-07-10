# -*- mode: ruby -*-
# vi: set ft=ruby :

class mysql::install {
	$password = 'vagrant'
	package {[
		'mysql-client',
		'mysql-server',
		'libmysqlclient-dev'
		]:
		ensure => installed,
	}

	exec { 'Set MySQL server\'s root password':
		subscribe   => [
			Package['mysql-server'],
			Package['mysql-client'],
		],
		refreshonly => true,
		unless      => "mysqladmin -uroot -p${password} status",
		command     => "mysqladmin -uroot password ${password}",
	}
}
